// src/core/agentGraph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AgentStateChannels } from "./agentState";
import { 
  EnhancePromptAgent, 
  TaskBreakdownAgent, 
  TaskReplanningAgent, 
  ActionAgent, 
  CompletionAgent,
} from "./agents";
import { WorkflowBuilder, WorkflowConfig } from "./WorkflowBuilder";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { toolRegistry } from "./tools/registry";
import { createAgentTool } from "./toolkit";
import { BaseAgent } from "./BaseAgent";
import { EventEmitter, AgentEventPayload } from "./EventEmitter";
import { AgentConfig } from "./agentConfig";
import { createCustomAgentClass, CustomAgent } from "./CustomActionAgent";
import { getProviderKey, LlmProvider, ProcessedImage } from "./llm";
import { RAGConfig } from "./tools/ragSearch";
import { McpClient, McpConfig } from "./mcp";

export interface ReactAgentConfig {
  geminiKey?: string;
  openaiKey?: string;
  useEnhancedPrompt?: boolean; // New option to enable enhance prompt mode
  memory?: "in-memory" | "postgres" | "redis"; // Memory type to use
  enableToolSummary?: boolean; // Whether to get LLM summary of tool results (default: true)
  sessionId?: string; // Session ID for memory initialization
  braveApiKey?: string; // For web search tool
  heliconeKey?: string; // For OpenAI with Helicone
  useSubgraph?: boolean; // New option to enable subgraph mode
  rag?: RAGConfig;
  mcp?: McpConfig; // MCP server configuration
}

export interface AgentRequest {
  objective: string;
  prompt?: string;
  outputInstruction?: string;
  sessionId?: string;
  images?: ImageInput[];
}

export interface ImageInput {
  data: string | Buffer; // File path, base64 string, or Buffer
  mimeType?: string; // Optional MIME type (e.g., 'image/jpeg', 'image/png')
  detail?: 'auto' | 'low' | 'high'; // Image detail level for processing
}

export interface AgentResponse {
  conclusion: string;
  sessionId: string;
  fullState: AgentState;
  error?: string;
}

const routingFunction = (state: AgentState) => {
  const currentTask = state.tasks[state.currentTaskIndex];
  
  // Route to completion if no task or task contains "summarize"
  return (!currentTask || currentTask.toLowerCase().includes("summarize")) 
    ? "completion" 
    : "action";
};

export interface BuilderContext {
  config: ReactAgentConfig;
  runtimeConfig: Record<string, any>;
  memoryInstance: any;
  preferredProvider: "gemini" | "openai" | "anthropic" | "openrouter";
  eventEmitter: EventEmitter;
  initializeMemory: (memoryType: string) => Promise<any>;
  generateSessionId: () => string;
}

class ReactAgentBuilder {
  private graph: any;
  private compiledGraph: any;
  private actionSubgraph: any;
  private config: ReactAgentConfig;
  private runtimeConfig: Record<string, any> = {};
  private memoryInstance: any; // Internal memory instance
  private preferredProvider: "gemini" | "openai" | "anthropic" | "openrouter";
  private eventEmitter: EventEmitter; // Event emitter for agent events
  private mcpClient?: McpClient; // MCP client instance
  private mcpConfig?: McpConfig; // MCP client configuration


  constructor(config: ReactAgentConfig) {
    // check if config ofe geminiKey and openaiKey is provided
    if (!config.geminiKey && !config.openaiKey) {
      throw new Error("At least one API key (GEMINI_KEY or OPENAI_KEY) is required");
    }
    this.preferredProvider = config.geminiKey ? "gemini" : "openai";

    // Memory will be initialized in invoke if not provided

    // Initialize configuration
    this.compiledGraph = null;
    this.config = config;
    this.eventEmitter = new EventEmitter();

    // Initialize MCP client if configuration is provided
    if (config.mcp) {
      this.mcpClient = new McpClient(config.mcp);
      this.mcpConfig = config.mcp;
    }

    return this;
  }

  /**
   * Connect to MCP servers and discover tools
   * This is called automatically during build() if MCP is configured
   */
  private async initializeMcp(): Promise<void> {
    if (!this.mcpClient) {
      return;
    }

    try {
      console.log("🔌 Connecting to MCP servers...");
      await this.mcpClient.connect();
      
      console.log("🔍 Discovering MCP tools...");
      const mcpTools = await this.mcpClient.discoverTools();
      
      if (mcpTools.length > 0) {
        this.addTool(mcpTools);
        console.log(`✅ Registered ${mcpTools.length} MCP tools`);
      } else {
        console.log("ℹ️ No MCP tools found");
      }
    } catch (error) {
      console.error("❌ Failed to initialize MCP:", error);
    }
  }

  /**
   * Add MCP servers configuration after initialization
   */
  addMcpServers(mcpConfig: McpConfig): ReactAgentBuilder {
    if (!this.mcpClient) {
      this.mcpClient = new McpClient(mcpConfig);
    } else {
      if (!this.graph && this.mcpConfig) {
        this.mcpConfig.servers = [...this.mcpConfig.servers, ...mcpConfig.servers];
        this.mcpClient = new McpClient(this.mcpConfig);
      } else {
        console.warn("MCP client already initialized. Create a new ReactAgentBuilder instance to use different MCP configuration.");
      }
    }
    return this;
  }

  /**
   * Get MCP connection status
   */
  getMcpStatus(): Record<string, boolean> | null {
    return this.mcpClient?.getConnectionStatus() || null;
  }

  private async initializeMemory(memoryType: string) {
    try {
      const { createMemory } = await import("./memory");
      return createMemory({
        type: memoryType as "in-memory" | "postgresql" | "redis",
        options: {
          sessionId: this.config.sessionId,
        }
      });
    } catch (error) {
      console.warn("Failed to initialize memory:", error);
      return null;
    }
  }

  // NOTE: need to be replaced with createWorkflow
  replaceActionNode(actionNode: any) {
    this.actionSubgraph = actionNode;
    this.config.useSubgraph = true; // Ensure subgraph mode is enabled
    console.log("ReactAgentBuilder: Action node replaced with subgraph mode enabled");
    return this;
  }

  /**
   * Initialize or update runtime configuration (e.g., model, runtime options)
   * Returns this for chaining (HoC/builder pattern)
   */
  init(runtimeConfig: Record<string, any>) {
    this.runtimeConfig = runtimeConfig;

    if (runtimeConfig.selectedProvider) {
      this.preferredProvider = runtimeConfig.selectedProvider;
    }

    this.graph = null;
    this.compiledGraph = null;

    console.log("ReactAgentBuilder: Runtime configuration initialized", this.runtimeConfig);
    return this;
  }

  buildGraph() {
    if (!this.graph) {
      // Choose action node based on configuration
      const actionNode = this.config.useSubgraph ? this.actionSubgraph.execute : ActionAgent.execute;
      // Graph setup - Using static methods for cleaner architecture
      this.graph = new StateGraph({ channels: AgentStateChannels });
      if (this.config.useEnhancedPrompt) {
        this.graph.addNode("enhancePrompt", EnhancePromptAgent.execute);
      }
      this.graph
          .addNode("taskBreakdown", TaskBreakdownAgent.execute)
          .addNode("taskReplanning", TaskReplanningAgent.execute)
          .addNode("action", actionNode) // Dynamic node selection
          .addNode("completion", CompletionAgent.execute);

      if (this.config.useEnhancedPrompt) {
        this.graph
          .addEdge(START, "enhancePrompt")
          .addEdge("enhancePrompt", "taskBreakdown");
      } else {
        this.graph.addEdge(START, "taskBreakdown");
      }
      this.graph
          .addEdge("taskBreakdown", "action")
          .addEdge("action", "taskReplanning")
          .addConditionalEdges("taskReplanning", routingFunction)
          .addEdge("completion", END);
      // Compile the graph
      console.log(`ReactAgentBuilder: Using ${this.config.useSubgraph ? 'ActionSubgraph' : 'ActionAgent'} for action processing`);
      this.compiledGraph = this.graph.compile();
    }
    return this;
  }

  build() {
    // Initialize MCP first (async)
    const initializeMcpPromise = this.initializeMcp();
    
    this.buildGraph();
    console.log("ReactAgentBuilder: Graph built successfully");
    
    const builtState = {
      compiledGraph: this.compiledGraph,
      runtimeConfig: { ...this.runtimeConfig },
      preferredProvider: this.preferredProvider,
      mcpInitPromise: initializeMcpPromise, // Pass MCP initialization promise
    };

    return {
      invoke: (request: AgentRequest, config?: any): Promise<AgentResponse> => {
        return this._invoke(builtState, request, config);
      },
      runtimeConfig: builtState.runtimeConfig,
      config: this.config,
      getMcpStatus: () => this.getMcpStatus(),
      mcpCleanup: () => this.mcpCleanup(),
    };
  }

  /**
   * High-level invoke method that encapsulates initialization and execution
   */
  private async _invoke(
    builtState: { compiledGraph: any; runtimeConfig: Record<string, any>; preferredProvider: string; mcpInitPromise?: Promise<void>; },
    request: AgentRequest,
    config?: any
  ): Promise<AgentResponse> {
    try {
      // Wait for MCP initialization if it exists
      if (builtState.mcpInitPromise) {
        await builtState.mcpInitPromise;
      }

      // if request.objective is not provided, throw error
      if (!request.objective) {
        throw new Error("Objective is required to invoke the agent");
      }
      // check if this.compiledGraph is already compiled
      if (!builtState.compiledGraph) {
        // this.buildGraph();
        throw new Error("Graph need to have been built to invoke the agent");
      }
      // Generate session ID internally
      const sessionId = request.sessionId || this.generateSessionId();
      
      // Initialize memory if not provided
      if (!this.memoryInstance && this.config.memory) {
        this.memoryInstance = await this.initializeMemory(this.config.memory);
        console.log(`🧠 Memory initialized: ${this.config.memory}`);
      }
      
      // Process images if provided
      let processedImages: ProcessedImage[] = [];
      if (request.images && request.images.length > 0) {
        const { processImageInputs } = await import("./imageUtils");
        processedImages = await processImageInputs(request.images);
        console.log(`🖼️ Processed ${processedImages.length} images for multimodal input`);
      }
      
      // Create initial state from request
      const initialState: AgentState = {
        objective: request.objective,
        prompt: request.prompt || request.objective,
        outputInstruction: request.outputInstruction || "",
        images: processedImages,
        tasks: [],
        currentTaskIndex: 0,
        actionResults: [],
        actionedTasks: [],
        lastActionResult: undefined,
        objectiveAchieved: false,
        conclusion: undefined,
        agentPhaseHistory: [],
      };

      // Create execution config with instance-specific config
      const executionConfig = {
        configurable: {
          ...config?.configurable,
          ...builtState.runtimeConfig, // Merge runtime config
          selectedProvider: builtState.preferredProvider,
          selectedKey: this.config[
            (getProviderKey(builtState.preferredProvider as LlmProvider) as 'geminiKey' | 'openaiKey' | undefined) ?? 'geminiKey'
          ],
          heliconeKey: this.config.heliconeKey, // Pass helicone key
          sessionId: sessionId,
          eventEmitter: this.eventEmitter, // Pass event emitter
          memory: this.memoryInstance,
          enableToolSummary: this.config.enableToolSummary,
          braveApiKey: this.config.braveApiKey, // Pass instance-specific tool config
          agentConfig: { ...this.config, ...builtState.runtimeConfig },
        }
      };

      console.log("AgentBuilder execution started:", {
        objective: request.objective,
        sessionId: sessionId,
        provider: executionConfig.configurable.selectedProvider
      });

      // Execute the agent workflow
      const result = await builtState.compiledGraph.invoke(initialState, executionConfig);

      return {
        conclusion: result.conclusion,
        sessionId: sessionId,
        fullState: result,
      };

    } catch (error: any) {
      console.error("Agent execution failed:", {
        objective: request.objective,
        error: error.message,
        stack: error.stack
      });

      const sessionId = request.sessionId || this.generateSessionId();
      return {
        conclusion: "Agent execution failed",
        sessionId: sessionId,
        fullState: {} as AgentState,
        error: error.message,
      };
    }
  }

  /**
   * Call LLM with standardized configuration and automatic tool injection
   */
  async callLLM(
    prompt: string,
    options: {
      provider?: string;
      model?: string;
      apiKey?: string;
      heliconeKey?: string;
      sessionId?: string;
      memory?: any;
      enableToolSummary?: boolean;
      maxTokens?: number;
      temperature?: number;
      agentConfig?: any;
      additionalHeaders?: Record<string, string>;
      images?: ProcessedImage[];
    } = {}
  ): Promise<string> {
    const provider = options.provider || this.preferredProvider;
    if (!this.config.geminiKey && !this.config.openaiKey) {
      throw new Error("No API key configured from builder");
    }
    const apiKey = options.apiKey || (provider === "gemini" ? this.config.geminiKey : this.config.openaiKey);

    // Merge config for BaseAgent.callLLM
    const mergedConfig = {
      configurable: {
        ...this.runtimeConfig,
        ...options,
        selectedProvider: provider,
        selectedKey: apiKey,
        heliconeKey: options.heliconeKey || this.config.heliconeKey,
        sessionId: options.sessionId || this.config.sessionId,
        memory: options.memory || this.memoryInstance,
        enableToolSummary: options.enableToolSummary ?? this.config.enableToolSummary,
        model: options.model,
        agentConfig: options.agentConfig || this.config,
      }
    };

    return BaseAgent.callLLM(
      prompt,
      mergedConfig,
      options.additionalHeaders,
      options.images
    );
  }

  /**
   * Generate a unique session ID for tracking
   */
  private generateSessionId(): string {
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    const ms = new Date().getMilliseconds().toString().padStart(3, "0");
    return `${randomPart}_${ms}`;
  }

  /**
   * Add custom tools to this agent instance
   * Accepts array of tools and acts as a bridge to toolRegistry
   */
  addTool(tools: DynamicStructuredTool[]): ReactAgentBuilder {
    
    // ✅ Handle array of tools
    tools.forEach(tool => {
      toolRegistry.register({
        tool,
        isAvailable: () => true, // Always available for custom tools
      });
      console.log(`✅ Added custom tool: ${tool.name}`);
    });
    
    return this;
  }

  /**
   * Update configuration after initialization
   */
  updateConfig(newConfig: Partial<ReactAgentConfig>) {
    this.config = { ...this.config, ...newConfig };
    return this;
  }

  /**
   * Legacy method for backward compatibility
   */
  compile() {
    if (!this.compiledGraph) {
        // Compile the graph if not already done
        this.buildGraph();
    }
    return this.compiledGraph;
  }

  /**
   * Event handling methods
   * Allows subscribing to agent events
   */
  public on(event: string, handler: (payload: AgentEventPayload) => void) {
    this.eventEmitter.on(event, handler);
  }
  public off(event: string, handler: (payload: AgentEventPayload) => void) {
    this.eventEmitter.off(event, handler);
  }


  /**
   * Create custom workflow with custom agent and graph
   */
  public createWorkflow(name: string, config?: WorkflowConfig ): WorkflowBuilder {


    const workflow = WorkflowBuilder.create(name, this)

    if (config) {
      workflow.withConfig(config)
    }

    return workflow;

  }

  /**
   * Create a custom agent to be used in the custom workflow
   */
  public createAgent(options: AgentConfig): CustomAgent {
    // Validate the required agent configuration properties
    if (!options.name || !options.model || !options.description || !options.provider) {
      throw new Error("Agent configuration must include name, model, provider and description.");
    }

    const selectedKey = options.apiKey ||  this.config[
      (getProviderKey(options.provider as LlmProvider) as 'geminiKey' | 'openaiKey' | undefined) ?? 'geminiKey'
    ] 

    // Use the factory to create a new agent class based on the provided configuration.
    // This class is a self-contained unit of logic that can be used in any workflow.
    return createCustomAgentClass({...options, apiKey: selectedKey});
  }

  public getContext(): BuilderContext {
    return {
      config: this.config,
      runtimeConfig: this.runtimeConfig,
      memoryInstance: this.memoryInstance,
      preferredProvider: this.preferredProvider,
      eventEmitter: this.eventEmitter,
      initializeMemory: this.initializeMemory.bind(this),
      generateSessionId: this.generateSessionId.bind(this),
    };
  }

  /**
   * Cleanup method to disconnect from MCP servers
   * Should be called when the agent is no longer needed
   */
  async mcpCleanup(): Promise<void> {
    if (this.mcpClient) {
      await this.mcpClient.disconnect();
    }
  }
}

export {
  ReactAgentBuilder,
  createAgentTool,
};

export type {
  McpServerConfig,
  McpConfig,
} from "./mcp";
export type { AgentState, ProcessedImage } from "./agentState";
export { AgentStateChannels } from "./agentState";
export { processImageInputs, processImageInput } from "./imageUtils";
