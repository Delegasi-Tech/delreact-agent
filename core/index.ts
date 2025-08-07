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
import { SubgraphBuilder } from "./SubgraphBuilder";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { toolRegistry } from "./tools/registry";
import { createAgentTool } from "./toolkit";
import { BaseAgent } from "./BaseAgent";

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
}

export interface AgentRequest {
  objective: string;
  prompt?: string;
  outputInstruction?: string;
  sessionId?: string;
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

class ReactAgentBuilder {
  private graph: any;
  private compiledGraph: any;
  private actionSubgraph: any;
  private config: ReactAgentConfig;
  private runtimeConfig: Record<string, any> = {};
  private memoryInstance: any; // Internal memory instance
  private preferredProvider: "gemini" | "openai" | "anthropic" | "openrouter";
  public result?: AgentState; // Add result property to store the latest agent state

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

    return this;
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
    this.runtimeConfig = { ...this.runtimeConfig, ...runtimeConfig };
    if (runtimeConfig.selectedProvider) {
      this.preferredProvider = runtimeConfig.selectedProvider;
    }
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
    this.buildGraph();
    console.log("ReactAgentBuilder: Graph built successfully");
    // return Workflow interface object binding
    return {
      invoke: this.invoke.bind(this),
      runtimeConfig: this.runtimeConfig,
      config: this.config,
      result: this.result, // Expose the latest result
    };
  }

  /**
   * High-level invoke method that encapsulates initialization and execution
   */
  async invoke(request: AgentRequest, config?: any): Promise<AgentResponse> {
    try {
      // if request.objective is not provided, throw error
      if (!request.objective) {
        throw new Error("Objective is required to invoke the agent");
      }
      // check if this.compiledGraph is already compiled
      if (!this.compiledGraph) {
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
      
      // Create initial state from request
      const initialState: AgentState = {
        objective: request.objective,
        prompt: request.prompt || request.objective,
        outputInstruction: request.outputInstruction || "",
        tasks: [],
        currentTaskIndex: 0,
        actionResults: [],
        actionedTasks: [],
        objectiveAchieved: false,
        conclusion: undefined,
      };

      // Create execution config with instance-specific config
      const executionConfig = {
        configurable: {
          ...config?.configurable,
          ...this.runtimeConfig, // Merge runtime config
          selectedProvider: this.preferredProvider,
          selectedKey: this.preferredProvider === "gemini" ? this.config.geminiKey : this.config.openaiKey,
          heliconeKey: this.config.heliconeKey, // Pass helicone key
          sessionId: sessionId,
          memory: this.memoryInstance,
          enableToolSummary: this.config.enableToolSummary,
          braveApiKey: this.config.braveApiKey, // Pass instance-specific tool config
          agentConfig: this.config, // Pass full agent config to tools
        }
      };

      console.log("AgentBuilder execution started:", {
        objective: request.objective,
        sessionId: sessionId,
        provider: executionConfig.configurable.selectedProvider
      });

      // Execute the agent workflow
      const result = await this.compiledGraph.invoke(initialState, executionConfig);
      this.result = result

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
      options.additionalHeaders
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
}

export {
  ReactAgentBuilder,
  createAgentTool,
  SubgraphBuilder,
};
