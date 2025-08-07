import { DynamicStructuredTool } from "@langchain/core/tools";
import { fetchPageToMarkdownToolDef } from './fetchPageToMarkdown';
import { webSearchToolDef } from './webSearch';

// Import ReactAgentConfig type
interface ReactAgentConfig {
  geminiKey?: string;
  openaiKey?: string;
  selectedProvider?: "gemini" | "openai";
  useSubgraph?: boolean;
  memory?: "in-memory" | "postgres" | "redis";
  enableToolSummary?: boolean;
  sessionId?: string;
  braveApiKey?: string;
  heliconeKey?: string;
}

export interface ToolExecutionContext {
  sessionId?: string;
  memory?: any;
  agentConfig?: ReactAgentConfig;
}

export interface ToolDefinition {
  tool: DynamicStructuredTool;
  isAvailable: (context?: ToolExecutionContext) => boolean; // Dynamic check
}

export class ToolRegistry {
  private static instance: ToolRegistry;
  private toolDefinitions = new Map<string, ToolDefinition>();

  private constructor() {
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    const DEFAULT_TOOLS: ToolDefinition[] = [
      {
        tool: fetchPageToMarkdownToolDef,
        isAvailable: () => true, // Always available
      },
      {
        tool: webSearchToolDef,
        isAvailable: (context?: ToolExecutionContext) => {
          // Check if braveApiKey is available in agent config
          const hasBraveKey = !!(context?.agentConfig?.braveApiKey);
          return hasBraveKey;
        },
      }
    ];

    DEFAULT_TOOLS.forEach(toolDef => this.register(toolDef));
    console.log(`✅ Auto-registered ${DEFAULT_TOOLS.length} default tools`);
  }

  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  register(toolDef: ToolDefinition): void {
    this.toolDefinitions.set(toolDef.tool.name, toolDef);
    console.log(`�� Registered tool: ${toolDef.tool.name}`);
  }

  getAllTools(): DynamicStructuredTool[] {
    return Array.from(this.toolDefinitions.values())
      .map(toolDef => toolDef.tool);
  }

  getAvailableTools(context?: ToolExecutionContext): DynamicStructuredTool[] {
    return Array.from(this.toolDefinitions.values())
      .filter(toolDef => toolDef.isAvailable(context))
      .map(toolDef => toolDef.tool);
  }

  getToolsForAgent(agentName: string, context?: ToolExecutionContext): DynamicStructuredTool[] {
    return this.getAvailableTools(context);
  }

  getToolAvailabilityStatus(context?: ToolExecutionContext): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.toolDefinitions.forEach((toolDef, name) => {
      status[name] = toolDef.isAvailable(context);
    });
    return status;
  }

  createToolsWithConfig(agentConfig: ReactAgentConfig): DynamicStructuredTool[] {
    return Array.from(this.toolDefinitions.values())
      .filter(toolDef => toolDef.isAvailable({ agentConfig }))
      .map(toolDef => {
        return new DynamicStructuredTool({
          name: toolDef.tool.name,
          description: toolDef.tool.description,
          schema: toolDef.tool.schema,
          func: async (args: any) => {
            // ✅ Pass config to original tool - simple and generic!
            return await toolDef.tool.invoke({ ...args, agentConfig });
          }
        });
      });
  }
}

export const toolRegistry = ToolRegistry.getInstance();
