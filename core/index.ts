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
import { ProcessedDocument } from "./agentState";

export interface ReactAgentConfig {
  geminiKey?: string;
  openaiKey?: string;
  openrouterKey?: string;
  useEnhancedPrompt?: boolean; // New option to enable enhance prompt mode
  memory?: "in-memory" | "postgres" | "redis" | "sqlite"; // Memory type to use
  enableSessionPersistence?: boolean; // Enable SQLite persistence for session memory (default: false)
  customMemoryPath?: string; // Custom directory path for SQLite session storage (optional)
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
  files?: FileInput[];
}

export interface FileInput {
  type: 'image' | 'document';
  data: string | Buffer; // File path, base64 string, or Buffer
  mimeType?: string; // Optional MIME type (e.g., 'image/jpeg', 'image/png', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  detail?: 'auto' | 'low' | 'high'; // Image detail level for processing (image files only)
  options?: DocumentOptions; // Document processing options (document files only)
}

export interface DocumentOptions {
  maxRows?: number;
  includeHeaders?: boolean;
  sheetName?: string; // For Excel files
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

/**
 * Main builder class for creating and configuring DelReact agents
 */
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
    // check if config of geminiKey, openaiKey, or openrouterKey is provided
    if (!config.geminiKey && !config.openaiKey && !config.openrouterKey) {
      throw new Error("At least one API key (GEMINI_KEY, OPENAI_KEY, or OPENROUTER_KEY) is required");
    }
    this.preferredProvider = config.geminiKey ? "gemini" : config.openaiKey ? "openai" : "openrouter";

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

  getMcpStatus(): Record<string, boolean> | null {
    return this.mcpClient?.getConnectionStatus() || null;
  }

  private async initializeMemory(memoryType: string) {
    try {
      const { createMemory } = await import("./memory");
      return createMemory({
        type: memoryType as "in-memory" | "postgresql" | "redis" | "sqlite",
        enableSessionPersistence: this.config.enableSessionPersistence,
        customPath: this.config.customMemoryPath, // Pass custom path for SQLite
        options: {
          sessionId: this.config.sessionId,
        }
      });
    } catch (error) {
      console.warn("Failed to initialize memory:", error);
      return null;
    }
  }

  replaceActionNode(actionNode: any) {
    this.actionSubgraph = actionNode;
    this.config.useSubgraph = true; // Ensure subgraph mode is enabled
    console.log("ReactAgentBuilder: Action node replaced with subgraph mode enabled");
    return this;
  }

  /**
   * Initialize runtime configuration with support for separate reasoning and execution models
   */
  init(runtimeConfig: Record<string, any>) {
    this.runtimeConfig = runtimeConfig;

    if (runtimeConfig.selectedProvider) {
      this.preferredProvider = runtimeConfig.selectedProvider;
    }

    // Handle separate model configuration with validation and defaults
    this.validateAndSetupSeparateModels(runtimeConfig);

    this.graph = null;
    this.compiledGraph = null;

    console.log("ReactAgentBuilder: Runtime configuration initialized", this.runtimeConfig);
    return this;
  }

  /**
   * Validate and setup separate model configuration
   */
  private validateAndSetupSeparateModels(runtimeConfig: Record<string, any>) {
    const hasReasonConfig = runtimeConfig.reasonProvider || runtimeConfig.reasonModel;
    const hasExecutionConfig = runtimeConfig.selectedProvider || runtimeConfig.model;

    // Set default models if not provided
    if (hasReasonConfig && !runtimeConfig.reasonModel) {
      runtimeConfig.reasonModel = "gpt-4o-mini";
      console.warn("⚠️ reasonModel not specified, using default: gpt-4o-mini");
    }
    
    if (hasExecutionConfig && !runtimeConfig.model) {
      runtimeConfig.model = "gpt-4o-mini";
      console.warn("⚠️ execution model not specified, using default: gpt-4o-mini");
    }

    // Validate provider configurations
    if (
      runtimeConfig.reasonProvider &&
      !(
        this.config[getProviderKey(runtimeConfig.reasonProvider)] ||
        this.config['geminiKey']
      )
    ) {
      console.warn(`⚠️ No API key configured for reasoning provider: ${runtimeConfig.reasonProvider}`);
    }

    if (
      runtimeConfig.selectedProvider &&
      !(
        this.config[getProviderKey(runtimeConfig.selectedProvider)] ||
        this.config['geminiKey']
      )
    ) {
      console.warn(`⚠️ No API key configured for execution provider: ${runtimeConfig.selectedProvider}`);
    }

    // If separate models are configured, log the configuration
    if (hasReasonConfig || hasExecutionConfig) {
      console.log("🧠⚡ Separate model configuration:", {
        reasoning: runtimeConfig.reasonProvider ? 
          `${runtimeConfig.reasonProvider}/${runtimeConfig.reasonModel}` : 
          "Using execution config",
        execution: runtimeConfig.selectedProvider ? 
          `${runtimeConfig.selectedProvider}/${runtimeConfig.model}` : 
          "Using reasoning config"
      });
    }
  }

  buildGraph() {
    if (!this.graph) {
      // Choose action node based on configuration
      const actionNode = this.config.useSubgraph ? this.actionSubgraph.execute : ActionAgent.execute;
      
      // Create agent wrappers that apply appropriate model configuration
      const wrappedAgents = this.createAgentWrappers();
      
      // Graph setup - Using wrapped agents for separate model support
      this.graph = new StateGraph({ channels: AgentStateChannels });
      if (this.config.useEnhancedPrompt) {
        this.graph.addNode("enhancePrompt", wrappedAgents.enhancePrompt);
      }
      this.graph
          .addNode("taskBreakdown", wrappedAgents.taskBreakdown)
          .addNode("taskReplanning", wrappedAgents.taskReplanning)
          .addNode("action", wrappedAgents.action) // Dynamic node selection with wrapper
          .addNode("completion", wrappedAgents.completion);

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

  /**
   * Create agent wrappers that apply appropriate model configuration based on agent type
   */
  private createAgentWrappers() {
    const hasReasonConfig = this.runtimeConfig.reasonProvider || this.runtimeConfig.reasonModel;
    const hasExecutionConfig = this.runtimeConfig.selectedProvider || this.runtimeConfig.model;

    // If no separate configuration, use original agents
    if (!hasReasonConfig && !hasExecutionConfig) {
      const actionNode = this.config.useSubgraph ? this.actionSubgraph.execute : ActionAgent.execute;
      return {
        enhancePrompt: EnhancePromptAgent.execute,
        taskBreakdown: TaskBreakdownAgent.execute,
        taskReplanning: TaskReplanningAgent.execute,
        action: actionNode,
        completion: CompletionAgent.execute,
      };
    }

    // Create wrapped agents with appropriate model configuration
    const reasoningConfig = this.createReasoningConfig();
    const executionConfig = this.createExecutionConfig();

    return {
      enhancePrompt: this.wrapReasoningAgent(EnhancePromptAgent.execute, reasoningConfig),
      taskBreakdown: this.wrapReasoningAgent(TaskBreakdownAgent.execute, reasoningConfig),
      taskReplanning: this.wrapReasoningAgent(TaskReplanningAgent.execute, reasoningConfig),
      action: this.wrapExecutionAgent(
        this.config.useSubgraph ? this.actionSubgraph.execute : ActionAgent.execute, 
        executionConfig
      ),
      completion: this.wrapExecutionAgent(CompletionAgent.execute, executionConfig),
    };
  }

  /**
   * Create reasoning configuration for reasoning agents
   */
  private createReasoningConfig() {
    return {
      selectedProvider: this.runtimeConfig.reasonProvider || this.runtimeConfig.selectedProvider || this.preferredProvider,
      model: this.runtimeConfig.reasonModel || this.runtimeConfig.model || "gpt-4o-mini",
    };
  }

  /**
   * Create execution configuration for execution agents
   */
  private createExecutionConfig() {
    return {
      selectedProvider: this.runtimeConfig.selectedProvider || this.runtimeConfig.reasonProvider || this.preferredProvider,
      model: this.runtimeConfig.model || this.runtimeConfig.reasonModel || "gpt-4o-mini",
    };
  }

  /**
   * Wrap a reasoning agent to apply reasoning model configuration
   */
  private wrapReasoningAgent(originalAgent: any, reasoningConfig: any) {
    return async (input: unknown, config: Record<string, any>) => {
      const mergedConfig = {
        ...config,
        configurable: {
          ...config.configurable,
          ...reasoningConfig,
          selectedKey: this.config[
            (getProviderKey(reasoningConfig.selectedProvider as LlmProvider) as 'geminiKey' | 'openaiKey' | 'openrouterKey' | undefined) ?? 'geminiKey'
          ],
        }
      };
      return originalAgent(input, mergedConfig);
    };
  }

  /**
   * Wrap an execution agent to apply execution model configuration
   */
  private wrapExecutionAgent(originalAgent: any, executionConfig: any) {
    return async (input: unknown, config: Record<string, any>) => {
      const mergedConfig = {
        ...config,
        configurable: {
          ...config.configurable,
          ...executionConfig,
          selectedKey: this.config[
            (getProviderKey(executionConfig.selectedProvider as LlmProvider) as 'geminiKey' | 'openaiKey' | 'openrouterKey' | undefined) ?? 'geminiKey'
          ],
        }
      };
      return originalAgent(input, mergedConfig);
    };
  }

  /**
   * Build and compile the agent workflow
   */
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

      // Initialize session memory manager and load session
      let sessionMemory = undefined;
      let sessionContext = "";
      if (this.memoryInstance && 'retrieveSession' in this.memoryInstance) {
        const { SessionMemoryManager } = await import("./sessionMemory");
        const sessionManager = new SessionMemoryManager(this.memoryInstance);
        sessionMemory = await sessionManager.loadOrCreateSession(sessionId);
        sessionContext = sessionManager.generateSessionContext(sessionMemory);
        console.log(`🧠 Session memory loaded for: ${sessionId}`);
      }
      
      // Process files if provided (both images and documents)
      let processedImages: ProcessedImage[] = [];
      let processedDocuments: ProcessedDocument[] = [];
      
      if (request.files && request.files.length > 0) {
        const { processFileInputs } = await import("./fileUtils");
        const fileResults = await processFileInputs(request.files);
        processedImages = fileResults.images;
        processedDocuments = fileResults.documents;
        console.log(`📁 Processed ${processedImages.length} images and ${processedDocuments.length} documents`);
      }
      
      // Create initial state from request
      const initialState: AgentState = {
        objective: request.objective,
        prompt: request.prompt || request.objective,
        outputInstruction: request.outputInstruction || "",
        images: processedImages,
        documents: processedDocuments,
        tasks: [],
        currentTaskIndex: 0,
        actionResults: [],
        actionedTasks: [],
        lastActionResult: undefined,
        objectiveAchieved: false,
        conclusion: undefined,
        agentPhaseHistory: [],
        sessionMemory: sessionMemory,
      };

      // Create execution config with instance-specific config
      const executionConfig = {
        configurable: {
          ...config?.configurable,
          ...builtState.runtimeConfig, // Merge runtime config
          selectedProvider: builtState.preferredProvider,
          selectedKey: this.config[
            (getProviderKey(builtState.preferredProvider as LlmProvider) as 'geminiKey' | 'openaiKey' | 'openrouterKey' | undefined) ?? 'geminiKey'
          ],
          heliconeKey: this.config.heliconeKey, // Pass helicone key
          sessionId: sessionId,
          eventEmitter: this.eventEmitter, // Pass event emitter
          memory: this.memoryInstance,
          enableToolSummary: this.config.enableToolSummary,
          braveApiKey: this.config.braveApiKey, // Pass instance-specific tool config
          agentConfig: { ...this.config, ...builtState.runtimeConfig },
          sessionContext: sessionContext, // Pass session context for agents
        },
        recursionLimit: 100
      };

      console.log("AgentBuilder execution started:", {
        objective: request.objective,
        sessionId: sessionId,
        provider: executionConfig.configurable.selectedProvider,
        hasSessionMemory: !!sessionMemory
      });

      // Execute the agent workflow
      const result = await builtState.compiledGraph.invoke(initialState, executionConfig);

      // Update session memory after completion
      if (this.memoryInstance && 'storeSession' in this.memoryInstance && result.conclusion) {
        const { SessionMemoryManager } = await import("./sessionMemory");
        const sessionManager = new SessionMemoryManager(this.memoryInstance);
        await sessionManager.updateSession(
          sessionId,
          request.objective,
          result.conclusion,
          result.actionResults?.slice(-3) // Last 3 action results as key results
        );
        console.log(`💾 Session memory updated for: ${sessionId}`);
      }

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
    if (!this.config.geminiKey && !this.config.openaiKey && !this.config.openrouterKey) {
      throw new Error("No API key configured from builder");
    }
    const apiKey = options.apiKey || (
      provider === "gemini" ? this.config.geminiKey :
      provider === "openrouter" ? this.config.openrouterKey :
      this.config.openaiKey
    );

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

  private generateSessionId(): string {
    const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
    const ms = new Date().getMilliseconds().toString().padStart(3, "0");
    return `${randomPart}_${ms}`;
  }

  /**
   * Add custom tools to the agent
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

  updateConfig(newConfig: Partial<ReactAgentConfig>) {
    this.config = { ...this.config, ...newConfig };
    return this;
  }

  compile() {
    if (!this.compiledGraph) {
        // Compile the graph if not already done
        this.buildGraph();
    }
    return this.compiledGraph;
  }

  public on(event: string, handler: (payload: AgentEventPayload) => void) {
    this.eventEmitter.on(event, handler);
    return this;
  }
  public off(event: string, handler: (payload: AgentEventPayload) => void) {
    this.eventEmitter.off(event, handler);
  }


  public createWorkflow(name: string, config?: WorkflowConfig ): WorkflowBuilder {


    const workflow = WorkflowBuilder.create(name, this)

    if (config) {
      workflow.withConfig(config)
    }

    return workflow;

  }

  public createAgent(options: AgentConfig): CustomAgent {
    // Validate the required agent configuration properties
    if (!options.name || !options.model || !options.description || !options.provider) {
      throw new Error("Agent configuration must include name, model, provider and description.");
    }

    const selectedKey = options.apiKey ||  this.config[
      (getProviderKey(options.provider as LlmProvider) as 'geminiKey' | 'openaiKey' | 'openrouterKey' | undefined) ?? 'geminiKey'
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
export type { AgentState, ProcessedImage, ProcessedDocument } from "./agentState";
export { AgentStateChannels } from "./agentState";
export { processFileInputs, processImageFile, processDocumentFile } from "./fileUtils";
