import { DynamicStructuredTool } from "@langchain/core/tools";
import { fetchPageToMarkdownToolDef } from './fetchPageToMarkdown';
import { webSearchToolDef } from './webSearch';
import { ragSearchToolDef } from './ragSearch';
import { ReactAgentConfig } from '../index';

/**
 * Context object passed to tools during execution, providing access to session data and configuration.
 */
export interface ToolExecutionContext {
  /** Unique session identifier for tracking tool usage */
  sessionId?: string;
  /** Memory instance for persistent storage and retrieval */
  memory?: any;
  /** Agent configuration containing API keys and settings */
  agentConfig?: ReactAgentConfig;
}

/**
 * Definition object for registering tools with the registry.
 */
export interface ToolDefinition {
  /** The LangChain tool instance */
  tool: DynamicStructuredTool;
  /** Function to determine if the tool is available given the current context */
  isAvailable: (context?: ToolExecutionContext) => boolean;
}

/**
 * Singleton registry for managing and providing tools to agents.
 * Handles tool registration, availability checking, and dynamic tool injection based on agent configuration.
 * 
 * @example
 * ```typescript
 * import { toolRegistry } from "delreact-agent";
 * 
 * // Register a custom tool
 * toolRegistry.register({
 *   tool: myCustomTool,
 *   isAvailable: (context) => !!context?.agentConfig?.myApiKey
 * });
 * 
 * // Get available tools for an agent
 * const tools = toolRegistry.getAvailableTools({ agentConfig: config });
 * ```
 */
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
      },
      {
        tool: ragSearchToolDef,
        isAvailable: (context?: ToolExecutionContext) => {
          // Check if OpenAI key is available and RAG is configured with vector files
          const cfg = context?.agentConfig;
          const rag = cfg?.rag as any;
          const hasVectorFiles = Array.isArray(rag?.vectorFiles)
            ? rag.vectorFiles.length > 0
            : typeof rag?.vectorFile === "string";
          return Boolean(cfg?.openaiKey && hasVectorFiles);
        },
      }
    ];

    DEFAULT_TOOLS.forEach(toolDef => this.register(toolDef));
    console.log(`✅ Auto-registered ${DEFAULT_TOOLS.length} default tools`);
  }

  /**
   * Get the singleton instance of the ToolRegistry.
   * Creates the instance if it doesn't exist yet.
   * 
   * @returns The singleton ToolRegistry instance
   */
  static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  /**
   * Register a tool definition with the registry.
   * Makes the tool available for use by agents if availability conditions are met.
   * 
   * @param toolDef - Tool definition containing the tool and availability function
   * 
   * @example
   * ```typescript
   * toolRegistry.register({
   *   tool: myTool,
   *   isAvailable: (context) => !!context?.agentConfig?.apiKey
   * });
   * ```
   */
  register(toolDef: ToolDefinition): void {
    this.toolDefinitions.set(toolDef.tool.name, toolDef);
    console.log(`�� Registered tool: ${toolDef.tool.name}`);
  }

  /**
   * Get all registered tools regardless of availability.
   * 
   * @returns Array of all registered DynamicStructuredTool instances
   */
  getAllTools(): DynamicStructuredTool[] {
    return Array.from(this.toolDefinitions.values())
      .map(toolDef => toolDef.tool);
  }

  /**
   * Get tools that are available given the current execution context.
   * Filters tools based on their availability functions and the provided context.
   * 
   * @param context - Execution context containing session and configuration data
   * @returns Array of available DynamicStructuredTool instances
   * 
   * @example
   * ```typescript
   * const availableTools = toolRegistry.getAvailableTools({
   *   agentConfig: { braveApiKey: "...", openaiKey: "..." }
   * });
   * ```
   */
  getAvailableTools(context?: ToolExecutionContext): DynamicStructuredTool[] {
    return Array.from(this.toolDefinitions.values())
      .filter(toolDef => toolDef.isAvailable(context))
      .map(toolDef => toolDef.tool);
  }

  /**
   * Get tools available for a specific agent.
   * Currently returns the same as getAvailableTools but allows for future agent-specific filtering.
   * 
   * @param agentName - Name of the agent requesting tools
   * @param context - Execution context containing session and configuration data
   * @returns Array of available DynamicStructuredTool instances
   */
  getToolsForAgent(agentName: string, context?: ToolExecutionContext): DynamicStructuredTool[] {
    return this.getAvailableTools(context);
  }

  /**
   * Get the availability status of all registered tools for a given context.
   * Useful for debugging and understanding which tools are available.
   * 
   * @param context - Execution context to check tool availability against
   * @returns Object mapping tool names to their availability status
   * 
   * @example
   * ```typescript
   * const status = toolRegistry.getToolAvailabilityStatus({
   *   agentConfig: { braveApiKey: "...", openaiKey: null }
   * });
   * console.log(status); // { "webSearch": true, "ragSearch": false }
   * ```
   */
  getToolAvailabilityStatus(context?: ToolExecutionContext): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    this.toolDefinitions.forEach((toolDef, name) => {
      status[name] = toolDef.isAvailable(context);
    });
    return status;
  }

  /**
   * Create tools with agent configuration injected for execution.
   * Creates new tool instances that automatically pass the agent configuration to tool functions.
   * 
   * @param agentConfig - Agent configuration to inject into tools
   * @returns Array of configured DynamicStructuredTool instances
   * 
   * @example
   * ```typescript
   * const configuredTools = toolRegistry.createToolsWithConfig({
   *   braveApiKey: process.env.BRAVE_API_KEY,
   *   openaiKey: process.env.OPENAI_KEY
   * });
   * ```
   */
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

/**
 * Global singleton instance of the ToolRegistry.
 * Use this to register tools and manage tool availability across the application.
 * 
 * @example
 * ```typescript
 * import { toolRegistry } from "delreact-agent";
 * 
 * // Register a custom tool
 * toolRegistry.register(myToolDefinition);
 * 
 * // Get available tools
 * const tools = toolRegistry.getAvailableTools(context);
 * ```
 */
export const toolRegistry = ToolRegistry.getInstance();
