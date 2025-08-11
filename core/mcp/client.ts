import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createAgentTool } from "../toolkit";
import { z } from "zod";

/**
 * Configuration for an MCP server connection
 */
export interface McpServerConfig {
  /** Unique name for the MCP server */
  name: string;
  /** Command to start the MCP server */
  command: string;
  /** Arguments to pass to the MCP server command */
  args?: string[];
  /** Environment variables to set for the MCP server */
  env?: Record<string, string>;
  /** Timeout for connecting to the server (in milliseconds) */
  timeout?: number;
}

/**
 * Configuration for MCP integration in ReactAgentBuilder
 */
export interface McpConfig {
  /** List of MCP servers to connect to */
  servers: McpServerConfig[];
  /** Whether to automatically register tools from MCP servers */
  autoRegister?: boolean;
  /** Timeout for MCP operations (in milliseconds) */
  operationTimeout?: number;
}

/**
 * MCP Client wrapper that manages connections to external MCP servers
 * and provides tool discovery and execution capabilities
 */
export class McpClient {
  private clients = new Map<string, Client>();
  private connected = new Map<string, boolean>();
  private config: McpConfig;

  constructor(config: McpConfig) {
    this.config = config;
  }

  /**
   * Connect to all configured MCP servers
   */
  async connect(): Promise<void> {
    const connectPromises = this.config.servers.map(serverConfig => 
      this.connectToServer(serverConfig)
    );

    await Promise.allSettled(connectPromises);
  }

  /**
   * Connect to a specific MCP server
   */
  private async connectToServer(serverConfig: McpServerConfig): Promise<void> {
    try {
      const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args || [],
        env: serverConfig.env,
      });

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
      
      console.log(`✅ Connected to MCP server: ${serverConfig.name}`);
    } catch (error) {
      console.error(`❌ Failed to connect to MCP server ${serverConfig.name}:`, error);
      this.connected.set(serverConfig.name, false);
    }
  }

  /**
   * Discover all available tools from connected MCP servers
   */
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

  /**
   * Convert an MCP tool definition to a DelReact tool
   */
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
          throw new Error(`MCP tool execution failed: ${error.message}`);
        }
      }
    });
  }

  /**
   * Convert MCP JSON Schema to Zod schema
   * This is a simplified conversion - could be enhanced for more complex schemas
   */
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

  /**
   * Disconnect from all MCP servers
   */
  async disconnect(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(client => 
      client.close().catch(err => console.error('Error disconnecting MCP client:', err))
    );

    await Promise.allSettled(disconnectPromises);
    
    this.clients.clear();
    this.connected.clear();
    
    console.log('🔌 Disconnected from all MCP servers');
  }

  /**
   * Get connection status for all servers
   */
  getConnectionStatus(): Record<string, boolean> {
    return Object.fromEntries(this.connected.entries());
  }

  /**
   * Check if a specific server is connected
   */
  isServerConnected(serverName: string): boolean {
    return this.connected.get(serverName) ?? false;
  }
}