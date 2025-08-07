// src/actionSubgraph.ts
import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, AgentStateChannels } from "../agentState";
import { ResearchAgent, AnalysisAgent, SynthesisAgent } from "./subgraphAgents";

/**
 * Action Subgraph - Replaces single ActionAgent with multi-step process
 * 
 * Flow: Research → Analysis → Synthesis
 * - Research: Gathers comprehensive information
 * - Analysis: Creates structured insights  
 * - Synthesis: Produces final actionable result
 * 
 * Uses shared AgentState and AgentStateChannels for seamless integration
 */
export class ActionSubgraph {
  private static subgraph: any = null;

  /**
   * Create and compile the action subgraph
   * Uses same state channels as parent graph for compatibility
   */
  static createSubgraph() {
    if (ActionSubgraph.subgraph) {
      return ActionSubgraph.subgraph;
    }

    // Create subgraph using shared AgentStateChannels - no state transformation needed!
    const subgraphBuilder = new StateGraph({ channels: AgentStateChannels })
      .addNode("research", ResearchAgent.execute)
      .addNode("analysis", AnalysisAgent.execute)  
      .addNode("synthesis", SynthesisAgent.execute)
      .addEdge(START, "research")
      .addEdge("research", "analysis")
      .addEdge("analysis", "synthesis")
      .addEdge("synthesis", END);

    ActionSubgraph.subgraph = subgraphBuilder.compile();
    return ActionSubgraph.subgraph;
  }

  /**
   * Execute the subgraph - can be used directly as a node function
   * Maintains same signature as original ActionAgent.execute
   */
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    const subgraph = ActionSubgraph.createSubgraph();

    console.log("ActionSubgraph: Starting execution", {
      objective: state.objective,
      currentTask: state.tasks[state.currentTaskIndex],
      taskIndex: state.currentTaskIndex
    });

    try {
      // Execute subgraph with full state - no transformation needed!
      const result = await subgraph.invoke(state, config);
      
      console.log("ActionSubgraph: Execution completed", {
        objective: state.objective,
        resultKeys: Object.keys(result),
        actionResultsCount: result.actionResults?.length || 0
      });

      return result;
    } catch (error: any) {
      console.error("ActionSubgraph: Execution failed", {
        error: error.message,
        objective: state.objective,
        currentTask: state.tasks[state.currentTaskIndex]
      });
      
      // Fallback to simple result on error
      return {
        actionResults: [...state.actionResults, `Error in subgraph execution: ${error.message}`],
        actionedTasks: [...state.actionedTasks, state.tasks[state.currentTaskIndex]],
        currentTaskIndex: state.currentTaskIndex + 1
      };
    }
  }

  /**
   * Get the compiled subgraph directly for advanced usage
   */
  static getCompiledSubgraph() {
    return ActionSubgraph.createSubgraph();
  }
}
