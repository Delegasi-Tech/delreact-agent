import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createAgentTool } from "../toolkit";
import { z } from "zod";

export interface McpServerConfig {
  name: string;
  // For stdio servers
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  timeout?: number;
  // For SSE servers
  url?: string;
  transport?: 'stdio' | 'sse';
  headers?: Record<string, string>;
}

export interface McpConfig {
  servers: McpServerConfig[];
  autoRegister?: boolean;
}

export interface McpConfig {
  servers: McpServerConfig[];
  autoRegister?: boolean;
  operationTimeout?: number;
}

export class McpClient {
  private clients = new Map<string, Client>();
  private connected = new Map<string, boolean>();
  private config: McpConfig;

  constructor(config: McpConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    const connectPromises = this.config.servers.map(serverConfig => 
      this.connectToServer(serverConfig)
    );

    await Promise.allSettled(connectPromises);
  }

  private async connectToServer(serverConfig: McpServerConfig): Promise<void> {
    try {
      // Early validation: ensure required fields are present
      if (!serverConfig.url && !serverConfig.command) {
        throw new Error(
          `Invalid MCP server configuration for '${serverConfig.name}': ` +
          `Must provide either 'url' (for SSE transport) or 'command' (for stdio transport)`
        );
      }

      let transport;
      
      // Determine transport type with explicit validation
      let transportType: 'stdio' | 'sse';
      
      if (serverConfig.transport) {
        // Explicit transport specified - validate required fields
        transportType = serverConfig.transport;
        switch (transportType) {
          case 'sse':
            if (!serverConfig.url) {
              throw new Error(
                `SSE transport requires 'url' for server: ${serverConfig.name}`
              );
            }
            break;
          case 'stdio':
            if (!serverConfig.command) {
              throw new Error(
                `Stdio transport requires 'command' for server: ${serverConfig.name}`
              );
            }
            break;
          default:
            // TypeScript exhaustiveness check - ensures all transport types are handled
            const _exhaustiveCheck: never = transportType;
            throw new Error(`Unsupported transport type: ${_exhaustiveCheck}`);
        }
      } else {
        // Auto-detect transport type based on provided fields
        transportType = serverConfig.url ? 'sse' : 'stdio';
      }
      
      // Create transport based on type
      switch (transportType) {
        case 'sse':
          // SSE transport - url is guaranteed to exist due to validation above
          transport = new SSEClientTransport(
            new URL(serverConfig.url!),
            {
              headers: serverConfig.headers || {}
            }
          );
          console.log(`🔌 Connecting to MCP server via SSE: ${serverConfig.name} (${serverConfig.url})`);
          break;
          
        case 'stdio':
          // Stdio transport - command is guaranteed to exist due to validation above
          transport = new StdioClientTransport({
            command: serverConfig.command!,
            args: serverConfig.args || [],
            env: serverConfig.env,
          });
          console.log(`🔌 Connecting to MCP server via stdio: ${serverConfig.name}`);
          break;
          
        default:
          // TypeScript exhaustiveness check
          const _exhaustiveCheck: never = transportType;
          throw new Error(`Unsupported transport type: ${_exhaustiveCheck}`);
      }

      const client = new Client(
        {
          name: `delreact-${serverConfig.name}`,
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      await client.connect(transport);
      
      this.clients.set(serverConfig.name, client);
      this.connected.set(serverConfig.name, true);
      
      console.log(`✅ Connected to MCP server (${transportType}): ${serverConfig.name}`);
    } catch (error) {
      console.error(`❌ Failed to connect to MCP server ${serverConfig.name}:`, error);
      this.connected.set(serverConfig.name, false);
    }
  }

  async discoverTools(): Promise<DynamicStructuredTool[]> {
    const tools: DynamicStructuredTool[] = [];

    for (const [serverName, client] of this.clients.entries()) {
      if (!this.connected.get(serverName)) {
        continue;
      }

      try {
        const { tools: mcpTools } = await client.listTools();
        
        for (const mcpTool of mcpTools) {
          const delReactTool = this.convertMcpToolToDelReactTool(mcpTool, serverName, client);
          tools.push(delReactTool);
        }

        console.log(`🔧 Discovered ${mcpTools.length} tools from MCP server: ${serverName}`);
      } catch (error) {
        console.error(`❌ Failed to discover tools from MCP server ${serverName}:`, error);
      }
    }

    return tools;
  }

  private convertMcpToolToDelReactTool(
    mcpTool: any, 
    serverName: string, 
    client: Client
  ): DynamicStructuredTool {
    // Convert MCP tool schema to Zod schema
    const zodSchema = this.convertMcpSchemaToZod(mcpTool.inputSchema);
    
    return createAgentTool({
      name: `${serverName}--${mcpTool.name}`,
      description: `[MCP:${serverName}] ${mcpTool.description}`,
      zodSchema,
      async run(input: any) {
        try {
          // Remove agentConfig from input before sending to MCP server
          const { agentConfig, ...mcpInput } = input || {};
          
          const response = await client.callTool({
            name: mcpTool.name,
            arguments: mcpInput,
          });

          // Return tool result, handling both text content and complex responses
          if (response.content) {
            if (Array.isArray(response.content)) {
              return response.content
                .map(item => item.type === 'text' ? item.text : JSON.stringify(item))
                .join('\n');
            } else if (typeof response.content === 'string') {
              return response.content;
            } else {
              return JSON.stringify(response.content);
            }
          }

          return JSON.stringify(response);
        } catch (error: any) {
          console.error(`❌ MCP tool execution failed (${serverName}:${mcpTool.name}):`, error);
          throw new Error(`MCP tool execution failed (server: ${serverName}, tool: ${mcpTool.name}): ${error.message}`); 
        }
      }
    });
  }

  private convertMcpSchemaToZod(mcpSchema: any): z.ZodTypeAny {
    if (!mcpSchema || !mcpSchema.properties) {
      return z.object({});
    }

    const shape: Record<string, z.ZodTypeAny> = {};

    for (const [propName, propDef] of Object.entries(mcpSchema.properties as Record<string, any>)) {
      let zodType: z.ZodTypeAny;

      switch (propDef.type) {
        case 'string':
          zodType = z.string();
          break;
        case 'number':
          zodType = z.number();
          break;
        case 'integer':
          zodType = z.number().int();
          break;
        case 'boolean':
          zodType = z.boolean();
          break;
        case 'array':
          zodType = z.array(z.any());
          break;
        case 'object':
          zodType = z.object({}).catchall(z.any());
          break;
        default:
          zodType = z.any();
      }

      if (propDef.description) {
        zodType = zodType.describe(propDef.description);
      }

      // Check if property is required
      const isRequired = mcpSchema.required?.includes(propName) ?? false;
      if (!isRequired) {
        zodType = zodType.optional();
      }

      shape[propName] = zodType;
    }

    // Add agentConfig as optional parameter for DelReact compatibility
    shape.agentConfig = z.object({}).optional().describe("Agent configuration (automatically provided)");

    return z.object(shape);
  }

  async disconnect(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(client => 
      client.close().catch(err => console.error('Error disconnecting MCP client:', err))
    );

    await Promise.allSettled(disconnectPromises);
    
    this.clients.clear();
    this.connected.clear();
    
    console.log('🔌 Disconnected from all MCP servers');
  }

  getConnectionStatus(): Record<string, boolean> {
    return Object.fromEntries(this.connected.entries());
  }

  isServerConnected(serverName: string): boolean {
    return this.connected.get(serverName) ?? false;
  }
}