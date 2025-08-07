// src/core/SubgraphBuilder.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AgentStateChannels } from "./agentState";
import { BaseAgent } from "./BaseAgent";

/**
 * Configuration for subgraph execution
 */
export interface SubgraphConfig {
  errorStrategy?: "fail-fast" | "fallback" | "retry";
  timeout?: number;
  retries?: number;
  sessionId?: string;
  [key: string]: any;
}

/**
 * Configuration for individual agents within a subgraph
 */
export interface AgentNodeConfig {
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  [key: string]: any;
}

/**
 * Condition function for routing logic
 */
export type ConditionFunction = (state: AgentState) => string | boolean;

/**
 * Switch configuration for multiple condition routing
 */
export interface SwitchConfig {
  condition: ConditionFunction;
  cases: Record<string, typeof BaseAgent>;
  default?: typeof BaseAgent;
}

/**
 * Branch configuration for simple boolean routing
 */
export interface BranchConfig {
  condition: ConditionFunction;
  ifTrue: typeof BaseAgent;
  ifFalse: typeof BaseAgent;
}

/**
 * Internal node representation
 */
interface SubgraphNode {
  id: string;
  agent: typeof BaseAgent;
  config?: AgentNodeConfig;
}

/**
 * Internal edge representation
 */
interface SubgraphEdge {
  from: string;
  to: string | SwitchConfig | BranchConfig;
  type: "linear" | "switch" | "branch";
}

/**
 * Default subgraph configuration
 */
const DEFAULT_SUBGRAPH_CONFIG: SubgraphConfig = {
  errorStrategy: "fallback",
  timeout: 30000,
  retries: 2
};

/**
 * Compiled subgraph with execution capabilities
 */
export class CompiledSubgraph {
  private subgraph: any = null;
  private config: SubgraphConfig;
  private name: string;

  constructor(
    private nodes: SubgraphNode[],
    private edges: SubgraphEdge[],
    name: string,
    config: SubgraphConfig = {}
  ) {
    this.name = name;
    this.config = { ...DEFAULT_SUBGRAPH_CONFIG, ...config };
    
    // Bind the execute method to preserve context
    this.execute = this.execute.bind(this);
    
    this.buildSubgraph();
  }

  /**
   * Static execute method for compatibility with agent patterns
   * This ensures the subgraph can be used anywhere a BaseAgent.execute is expected
   */
  static createExecute(compiledSubgraph: CompiledSubgraph) {
    return compiledSubgraph.execute.bind(compiledSubgraph);
  }

  /**
   * Build the LangGraph StateGraph from nodes and edges
   */
  private buildSubgraph() {
    const stateGraph = new StateGraph({ channels: AgentStateChannels });

    // Add all nodes
    this.nodes.forEach(node => {
      const nodeName = this.getNodeName(node.agent);
      stateGraph.addNode(nodeName, this.createNodeFunction(node));
    });

    // Add edges based on configuration
    this.addEdgesToGraph(stateGraph);

    this.subgraph = stateGraph.compile();
  }

  /**
   * Create node function with agent-specific configuration
   */
  private createNodeFunction(node: SubgraphNode) {
    return async (input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> => {
      // Merge agent-specific config with global config
      const mergedConfig = {
        ...config,
        agentConfig: {
          ...config.agentConfig,
          ...node.config
        }
      };

      return await node.agent.execute(input, mergedConfig);
    };
  }

  /**
   * Add edges to the StateGraph based on edge configuration
   */
  private addEdgesToGraph(stateGraph: StateGraph<any>) {
    this.edges.forEach((edge) => {
      switch (edge.type) {
        case "linear":
          const fromNode = edge.from === "START" ? START : edge.from;
          const toNode = edge.to === "END" ? END : edge.to as string;
          
          // Use proper type assertion for string nodes
          if (edge.from === "START") {
            stateGraph.addEdge(START, toNode as any);
          } else if (edge.to === "END") {
            stateGraph.addEdge(fromNode as any, END);
          } else {
            stateGraph.addEdge(fromNode as any, toNode as any);
          }
          break;

        case "switch":
          const switchFromNode = edge.from === "START" ? START : edge.from;
          const switchConfig = edge.to as SwitchConfig;
          this.addSwitchEdges(stateGraph, switchFromNode, switchConfig);
          break;

        case "branch":
          const branchFromNode = edge.from === "START" ? START : edge.from;
          const branchConfig = edge.to as BranchConfig;
          this.addBranchEdges(stateGraph, branchFromNode, branchConfig);
          break;
      }
    });
  }

  /**
   * Add switch-based conditional edges
   */
  private addSwitchEdges(stateGraph: StateGraph<any>, fromNode: any, switchConfig: SwitchConfig) {
    // Create routing function that returns the target node name
    const routingFunction = (state: AgentState) => {
      const result = switchConfig.condition(state);
      const resultStr = String(result);
      
      // Check if result matches any case
      if (switchConfig.cases[resultStr]) {
        return this.getNodeName(switchConfig.cases[resultStr]);
      }
      
      // Use default if available
      if (switchConfig.default) {
        return this.getNodeName(switchConfig.default);
      }
      
      // Fallback to END
      return END;
    };

    // Add conditional edges using the routing function
    stateGraph.addConditionalEdges(fromNode, routingFunction);
  }

  /**
   * Add branch-based conditional edges
   */
  private addBranchEdges(stateGraph: StateGraph<any>, fromNode: any, branchConfig: BranchConfig) {
    // Create routing function that returns the target node name
    const routingFunction = (state: AgentState) => {
      const result = branchConfig.condition(state);
      return result ? this.getNodeName(branchConfig.ifTrue) : this.getNodeName(branchConfig.ifFalse);
    };

    // Add conditional edges using the routing function
    stateGraph.addConditionalEdges(fromNode, routingFunction);
  }

  /**
   * Get node name from agent class
   */
  private getNodeName(agent: typeof BaseAgent): string {
    return agent.name.replace("Agent", "").toLowerCase();
  }

  /**
   * Execute the subgraph with comprehensive error handling
   */
  async execute(input: unknown, config: Record<string, any> = {}): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    
    // Ensure config is defined with fallback
    const safeConfig = this.config || DEFAULT_SUBGRAPH_CONFIG;
    
    // Defensive check for state
    if (!state) {
      throw new Error("State is required for subgraph execution");
    }

    // Ensure required state properties exist with fallbacks
    const safeState = {
      ...state,
      objective: state.objective || "Unknown objective",
      tasks: state.tasks || [],
      currentTaskIndex: state.currentTaskIndex ?? 0,
      actionResults: state.actionResults || [],
      actionedTasks: state.actionedTasks || []
    };
    
    console.log(`${this.name}: Starting execution`, {
      objective: safeState.objective,
      currentTask: safeState.tasks[safeState.currentTaskIndex],
      taskIndex: safeState.currentTaskIndex,
      config: safeConfig.errorStrategy
    });

    try {
      const result = await this.executeWithRetry(safeState, config);
      
      console.log(`${this.name}: Execution completed`, {
        objective: safeState.objective,
        resultKeys: Object.keys(result),
        actionResultsCount: result.actionResults?.length || 0
      });

      return result;
    } catch (error: any) {
      return this.handleExecutionError(error, safeState);
    }
  }

  /**
   * Execute with retry logic based on configuration
   */
  private async executeWithRetry(state: AgentState, config: Record<string, any>): Promise<Partial<AgentState>> {
    let lastError: Error | null = null;
    const safeConfig = this.config || DEFAULT_SUBGRAPH_CONFIG;
    const maxRetries = safeConfig.retries || 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create execution promise first
        const executionPromise = this.subgraph.invoke(state, config);
        
        // Create timeout promise with proper cleanup
        const timeoutPromise = new Promise<never>((_, reject) => {
          const timer = setTimeout(() => reject(new Error("Subgraph execution timeout")), safeConfig.timeout);
          executionPromise.finally(() => clearTimeout(timer));
        });
        
        return await Promise.race([executionPromise, timeoutPromise]) as Partial<AgentState>;
      } catch (error: any) {
        lastError = error;
        console.warn(`${this.name}: Attempt ${attempt + 1} failed`, {
          error: error.message,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1
        });

        if (attempt < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError;
  }

  /**
   * Handle execution errors based on strategy
   */
  private handleExecutionError(error: Error, state: AgentState): Partial<AgentState> {
    const safeConfig = this.config || DEFAULT_SUBGRAPH_CONFIG;
    
    console.error(`${this.name}: Execution failed`, {
      error: error.message,
      strategy: safeConfig.errorStrategy,
      objective: state.objective,
      currentTask: state.tasks[state.currentTaskIndex]
    });

    switch (safeConfig.errorStrategy) {
      case "fail-fast":
        throw error;

      case "fallback":
        return {
          actionResults: [...state.actionResults, `${this.name} failed: ${error.message}`],
          actionedTasks: [...state.actionedTasks, state.tasks[state.currentTaskIndex]],
          currentTaskIndex: state.currentTaskIndex + 1
        };

      case "retry":
        // Already handled in executeWithRetry
        return {
          actionResults: [...state.actionResults, `${this.name} failed after retries: ${error.message}`],
          actionedTasks: [...state.actionedTasks, state.tasks[state.currentTaskIndex]],
          currentTaskIndex: state.currentTaskIndex + 1
        };

      default:
        return {
          actionResults: [...state.actionResults, `${this.name} failed: ${error.message}`],
          actionedTasks: [...state.actionedTasks, state.tasks[state.currentTaskIndex]],
          currentTaskIndex: state.currentTaskIndex + 1
        };
    }
  }

  /**
   * Get the compiled LangGraph subgraph for advanced usage
   */
  getCompiledSubgraph() {
    return this.subgraph;
  }
}

/**
 * Fluent builder for creating agent subgraphs
 */
export class SubgraphBuilder {
  private nodes: SubgraphNode[] = [];
  private edges: SubgraphEdge[] = [];
  private config: SubgraphConfig = {};
  private name: string;
  private currentNode: string | null = null;

  private constructor(name: string) {
    this.name = name;
  }

  /**
   * Create a new subgraph builder
   */
  static create(name: string): SubgraphBuilder {
    return new SubgraphBuilder(name);
  }

  /**
   * Set the starting agent
   */
  start(agent: typeof BaseAgent, config?: AgentNodeConfig): SubgraphBuilder {
    const nodeName = this.getNodeName(agent);
    
    this.nodes.push({
      id: nodeName,
      agent,
      config
    });

    this.edges.push({
      from: "START",
      to: nodeName,
      type: "linear"
    });

    this.currentNode = nodeName;
    return this;
  }

  /**
   * Add the next agent in sequence
   */
  then(agent: typeof BaseAgent, config?: AgentNodeConfig): SubgraphBuilder {
    if (!this.currentNode) {
      throw new Error("Must call start() before then()");
    }

    const nodeName = this.getNodeName(agent);
    
    this.nodes.push({
      id: nodeName,
      agent,
      config
    });

    this.edges.push({
      from: this.currentNode,
      to: nodeName,
      type: "linear"
    });

    this.currentNode = nodeName;
    return this;
  }

  /**
   * Add switch-based conditional routing
   */
  switch(switchConfig: SwitchConfig): SubgraphBuilder {
    if (!this.currentNode) {
      throw new Error("Must call start() before switch()");
    }

    // Add nodes for each case
    Object.values(switchConfig.cases).forEach(agent => {
      const nodeName = this.getNodeName(agent);
      if (!this.nodes.find(n => n.id === nodeName)) {
        this.nodes.push({
          id: nodeName,
          agent
        });
      }
    });

    // Add default node if specified
    if (switchConfig.default) {
      const defaultNodeName = this.getNodeName(switchConfig.default);
      if (!this.nodes.find(n => n.id === defaultNodeName)) {
        this.nodes.push({
          id: defaultNodeName,
          agent: switchConfig.default
        });
      }
    }

    this.edges.push({
      from: this.currentNode,
      to: switchConfig,
      type: "switch"
    });

    // Reset current node - user must explicitly call then() after switch
    this.currentNode = null;
    return this;
  }

  /**
   * Add branch-based conditional routing
   */
  branch(branchConfig: BranchConfig): SubgraphBuilder {
    if (!this.currentNode) {
      throw new Error("Must call start() before branch()");
    }

    // Add nodes for both branches
    [branchConfig.ifTrue, branchConfig.ifFalse].forEach(agent => {
      const nodeName = this.getNodeName(agent);
      if (!this.nodes.find(n => n.id === nodeName)) {
        this.nodes.push({
          id: nodeName,
          agent
        });
      }
    });

    this.edges.push({
      from: this.currentNode,
      to: branchConfig,
      type: "branch"
    });

    // Reset current node - user must explicitly call then() after branch
    this.currentNode = null;
    return this;
  }

  /**
   * Set global subgraph configuration
   */
  withConfig(config: SubgraphConfig): SubgraphBuilder {
    this.config = { ...this.config, ...config };
    return this;
  }

  /**
   * Build and compile the subgraph
   */
  build(): CompiledSubgraph {
    if (!this.nodes.length) {
      throw new Error("Subgraph must have at least one node");
    }

    // Add END edge if current node exists (linear flow)
    if (this.currentNode) {
      this.edges.push({
        from: this.currentNode,
        to: "END",
        type: "linear"
      });
    }

    const compiledSubgraph = new CompiledSubgraph(this.nodes, this.edges, this.name, this.config);
    
    // Add a static execute method for compatibility
    (compiledSubgraph as any).execute = compiledSubgraph.execute.bind(compiledSubgraph);
    
    return compiledSubgraph;
  }

  /**
   * Get node name from agent class
   */
  private getNodeName(agent: typeof BaseAgent): string {
    return agent.name.replace("Agent", "").toLowerCase();
  }
}
