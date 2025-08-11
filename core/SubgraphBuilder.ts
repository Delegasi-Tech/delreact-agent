// src/core/SubgraphBuilder.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AgentStateChannels } from "./agentState";
import { BaseAgent } from "./BaseAgent";
import { AgentRequest, AgentResponse, BuilderContext, ReactAgentBuilder } from ".";

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
  public invoke!: (request: AgentRequest, config?: any) => Promise<AgentResponse>;

  constructor(
    nodes: SubgraphNode[],
    edges: SubgraphEdge[],
    name: string,
    builder: BuilderContext,
    config?: SubgraphConfig,
  ) {
    this.name = name;
    this.config = { ...DEFAULT_SUBGRAPH_CONFIG, ...config };

    // Create the high-level invoke method, binding it to the builder instance
    this.invoke = this._invoke.bind(this, builder);
 
    this.buildSubgraph(nodes, edges);
  }

   /**
   * High-level invoke method that encapsulates initialization and execution for the standalone workflow.
   * This is created and bound by the constructor.
   */
   private async _invoke(builder: BuilderContext, request: AgentRequest, config?: any): Promise<AgentResponse> {
      if (!request.objective) {
        throw new Error("Objective is required to invoke the workflow");
      } 
      
      const sessionId = request.sessionId || builder.generateSessionId();
      
      // Initialize memory
      if (!builder.memoryInstance && builder.config.memory) {
        // builder.memoryInstance = await builder.initializeMemory(builder.config.memory);
        // console.log(`🧠 Memory initialized for workflow: ${builder.config.memory}`);
      }
      
      // Create initial state from request
      const initialState: AgentState = {
        objective: request.objective,
        prompt: request.prompt || request.objective,
        outputInstruction: request.outputInstruction || "",
        tasks: [request.objective],
        currentTaskIndex: 0,
        actionResults: [],
        actionedTasks: [],
        objectiveAchieved: false,
        conclusion: undefined,
        agentPhaseHistory: [],
      };

      const executionConfig = {
        configurable: {
          ...config?.configurable,
          ...builder.runtimeConfig,
          ...this.config, // Pass through workflow config including debug flag
          debug: true,
          heliconeKey: builder.config.heliconeKey,
          sessionId: sessionId,
          eventEmitter: builder.eventEmitter,
          memory: builder.memoryInstance,
          enableToolSummary: builder.config.enableToolSummary,
          braveApiKey: builder.config.braveApiKey,
          agentConfig: builder.config,
        }
      };

      console.log(`Workflow "${this.name}" execution started:`, {
        objective: request.objective,
        sessionId: sessionId,
      });

      try {

      const result = await this.executeWithRetry(initialState, executionConfig);

      const conclusion = result.conclusion || (result.actionResults && result.actionResults[result.actionResults.length - 1]) || "Workflow completed without a conclusion.";

      return {
        conclusion,
        sessionId: sessionId,
        fullState: result as AgentState,
      };

    } catch (error: any) {
      console.error(`Workflow "${this.name}" execution failed:`, {
        objective: request.objective,
        error: error.message,
        stack: error.stack
      });
      
      const result = this.handleExecutionError(error, initialState);

      return {
        conclusion: result?.conclusion || "Workflow completed without a conclusion.",
        sessionId: sessionId,
        fullState: result as AgentState,
      };

    }
  }


  /**
   * Build the LangGraph StateGraph from nodes and edges
   */
  private buildSubgraph(nodes: SubgraphNode[], edges: SubgraphEdge[]) {
    const stateGraph = new StateGraph({ channels: AgentStateChannels });

    // Add all nodes
    nodes.forEach(node => {
      const nodeName = this.getNodeName(node.agent);
      stateGraph.addNode(nodeName, this.createNodeFunction(node));
    });

    // Add edges based on configuration
    this.addEdgesToGraph(stateGraph, edges);

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

      // Use new 3-phase execution for custom agents, fallback to traditional for others
      const executeMethod = (node.agent as any).executeWithPlanning || node.agent.execute;
      return await executeMethod.call(node.agent, input, mergedConfig);
    };
  }

  /**
   * Add edges to the StateGraph based on edge configuration
   */
  private addEdgesToGraph(stateGraph: StateGraph<any>, edges: SubgraphEdge[]) {
    edges.forEach((edge) => {
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
      const targetAgent = result ? branchConfig.ifTrue : branchConfig.ifFalse;
      const targetNodeName = this.getNodeName(targetAgent);
      return targetNodeName;
    };

    // Add conditional edges using the routing function
    stateGraph.addConditionalEdges(fromNode, routingFunction);
  }

  /**
   * Get node name from agent class
   */
  protected getNodeName(agent: typeof BaseAgent): string {
    return agent.name.replace("Agent", "").toLowerCase();
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
  private _nodes: SubgraphNode[];
  private _edges: SubgraphEdge[];

  private root: SubgraphBuilder;
  private builder: ReactAgentBuilder;
  private name: string;
  private config: SubgraphConfig;

  private endpoints: Set<string>;

  protected constructor(
      name: string,
      builder: ReactAgentBuilder,
      root?: SubgraphBuilder,
      initialEndpoints?: string[]
  ) {
    this.name = name;
    this.builder = builder;
    this.root = root || this;
    
    if (this.root === this) {
      // I am the root builder
      this._nodes = [];
      this._edges = [];
    }
    
    this.endpoints = new Set(initialEndpoints || []);
  }

  /**
   * Create a new root subgraph builder.
   */
  static create(name: string, builder: ReactAgentBuilder): SubgraphBuilder {
    return new SubgraphBuilder(name, builder);
  }

  private addNode(agent: typeof BaseAgent, config?: AgentNodeConfig): string {
    const nodeName = this.getNodeName(agent);
    if (!this.root._nodes.find(n => n.id === nodeName)) {
      this.root._nodes.push({ id: nodeName, agent, config });
    }
    return nodeName;
  }

  start(agent: typeof BaseAgent, config?: AgentNodeConfig): SubgraphBuilder {
    if (this.root !== this || this.root._nodes.length > 0) {
      throw new Error(".start() can only be called once on the main workflow builder.");
    }
    const nodeName = this.addNode(agent, config);
    this.root._edges.push({ from: "START", to: nodeName, type: "linear" });
    this.endpoints = new Set([nodeName]);
    return this;
  }

  then(agent: typeof BaseAgent, config?: AgentNodeConfig): SubgraphBuilder {
    if (this.endpoints.size === 0) {
      throw new Error("Cannot call .then() on a path that has been split or terminated. Use .merge() to join paths first.");
    }
    const toNode = this.addNode(agent, config);
    for (const fromNode of this.endpoints) {
      this.root._edges.push({ from: fromNode, to: toNode, type: "linear" });
    }
    this.endpoints = new Set([toNode]);
    return this;
  }

  branch(branchConfig: BranchConfig): { ifTrue: SubgraphBuilder; ifFalse: SubgraphBuilder } {
    if (this.endpoints.size !== 1) {
      throw new Error(".branch() can only be called on a linear path with a single endpoint.");
    }
    const fromNode = Array.from(this.endpoints)[0];
    const ifTrueNodeName = this.addNode(branchConfig.ifTrue);
    const ifFalseNodeName = this.addNode(branchConfig.ifFalse);

    this.root._edges.push({ from: fromNode, to: branchConfig, type: "branch" });
    this.endpoints.clear(); // This builder's path is now split and terminated.

    return {
      ifTrue: new SubgraphBuilder(this.name, this.builder, this.root, [ifTrueNodeName]),
      ifFalse: new SubgraphBuilder(this.name, this.builder, this.root, [ifFalseNodeName]),
    };
  }

  switch(switchConfig: SwitchConfig): Record<string, SubgraphBuilder> {
    if (this.endpoints.size !== 1) {
      throw new Error(".switch() can only be called on a linear path with a single endpoint.");
    }
    const fromNode = Array.from(this.endpoints)[0];
    const pathBuilders: Record<string, SubgraphBuilder> = {};

    Object.values(switchConfig.cases).forEach(agent => this.addNode(agent));
    if (switchConfig.default) this.addNode(switchConfig.default);

    this.root._edges.push({ from: fromNode, to: switchConfig, type: "switch" });
    
    for (const [caseName, agent] of Object.entries(switchConfig.cases)) {
        const nodeName = this.getNodeName(agent);
        pathBuilders[caseName] = new SubgraphBuilder(this.name, this.builder, this.root, [nodeName]);
    }
    if (switchConfig.default) {
        const nodeName = this.getNodeName(switchConfig.default);
        pathBuilders["default"] = new SubgraphBuilder(this.name, this.builder, this.root, [nodeName]);
    }

    this.endpoints.clear(); // This builder's path is now split and terminated.
    return pathBuilders;
  }

  merge(paths: SubgraphBuilder[]): SubgraphBuilder {
    if (this.root !== this) {
      throw new Error(".merge() can only be called on the main workflow builder.");
    }
    const mergedEndpoints: string[] = [];
    for (const path of paths) {
        mergedEndpoints.push(...Array.from(path.endpoints));
    }
    // Return a new builder representing the merged state.
    return new SubgraphBuilder(this.name, this.builder, this.root, mergedEndpoints);
  }

  withConfig(config: SubgraphConfig): SubgraphBuilder {
    this.config = { ...this.config, ...config };
    return this;
  }
  
  build(): CompiledSubgraph {
    if (this.root !== this) {
      throw new Error(".build() can only be called on the main workflow builder.");
    }

    // Connect any un-merged, open paths to the END node.
    const allFromNodes = new Set(this.root._edges.map(e => e.from));
    this.root._nodes.forEach(node => {
        // If a node is a destination but never a source, it's an endpoint.
        const isEndpoint = this.root._edges.some(e => {
            if (typeof e.to === 'string') return e.to === node.id;
            if ('cases' in e.to) { // SwitchConfig
                const destinations = Object.values(e.to.cases).map(a => this.getNodeName(a));
                if (e.to.default) destinations.push(this.getNodeName(e.to.default));
                return destinations.includes(node.id);
            }
            if ('ifTrue' in e.to) { // BranchConfig
                return this.getNodeName(e.to.ifTrue) === node.id || this.getNodeName(e.to.ifFalse) === node.id;
            }
            return false;
        });

        if (isEndpoint && !allFromNodes.has(node.id)) {
            this.root._edges.push({ from: node.id, to: "END", type: "linear" });
        }
    });

    // Detect cycles before compiling
    const cycleCheck = this.detectCycle();
    if (cycleCheck.hasCycle) {
      const pathString = cycleCheck.path?.join(" -> ");
      throw new Error(`A cycle was detected in the subgraph, which would cause an infinite loop. Path: ${pathString}`);
    }

    const compiledSubgraph = new CompiledSubgraph(this.root._nodes, this.root._edges, this.name, this.builder.getContext(), this.config);

    return compiledSubgraph;
  }

  protected getNodeName(agent: typeof BaseAgent): string {
    return agent.name.replace("Agent", "").toLowerCase();
  }

  /**
   * Creates an adjacency list representation of the graph for cycle detection.
   */
  private getAdjacencyList(): Map<string, string[]> {
    const adjList = new Map<string, string[]>();
    this.root._nodes.forEach(node => adjList.set(node.id, []));

    this.root._edges.forEach(edge => {
      const from = edge.from;
      if (from === "START") return; // START is an entry point, not part of a cycle.

      const fromNodeList = adjList.get(from);
      if (!fromNodeList) return;

      if (edge.type === 'linear') {
        const to = edge.to as string;
        if (to !== 'END') {
          fromNodeList.push(to);
        }
      } else if (edge.type === 'switch') {
        const switchConfig = edge.to as SwitchConfig;
        const destinations = Object.values(switchConfig.cases).map(a => this.getNodeName(a));
        if (switchConfig.default) {
          destinations.push(this.getNodeName(switchConfig.default));
        }
        [...new Set(destinations)].forEach(to => fromNodeList.push(to));
      } else if (edge.type === 'branch') {
        const branchConfig = edge.to as BranchConfig;
        const destinations = [branchConfig.ifTrue, branchConfig.ifFalse].map(a => this.getNodeName(a));
        [...new Set(destinations)].forEach(to => fromNodeList.push(to));
      }
    });
    return adjList;
  }

  /**
   * Detects cycles in the graph using Depth First Search (DFS).
   * @returns An object indicating if a cycle was found and the path of the cycle.
   */
  private detectCycle(): { hasCycle: boolean; path?: string[] } {
    const adjList = this.getAdjacencyList();
    const visiting = new Set<string>(); // Nodes currently in the recursion stack for DFS.
    const visited = new Set<string>();  // All nodes that have been visited.

    const findCycle = (node: string, path: string[]): string[] | null => {
      visiting.add(node);
      visited.add(node);

      const neighbors = adjList.get(node) || [];
      for (const neighbor of neighbors) {
        if (visiting.has(neighbor)) {
          // Cycle detected: found a back edge to a node in the current recursion stack.
          return [...path, node, neighbor];
        }
        if (!visited.has(neighbor)) {
          const result = findCycle(neighbor, [...path, node]);
          if (result) return result;
        }
      }

      visiting.delete(node); // Backtrack: remove node from recursion stack.
      return null;
    };

    for (const node of adjList.keys()) {
      if (!visited.has(node)) {
        const cyclePath = findCycle(node, []);
        if (cyclePath) {
          // Format the path for a clear error message.
          const loopNode = cyclePath[cyclePath.length - 1];
          const loopStartIndex = cyclePath.indexOf(loopNode);
          const formattedPath = cyclePath.slice(loopStartIndex, -1);
          return { hasCycle: true, path: [...formattedPath, loopNode] };
        }
      }
    }

    return { hasCycle: false };
  }
}
