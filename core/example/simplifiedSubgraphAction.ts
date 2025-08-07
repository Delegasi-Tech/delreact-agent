// src/core/example/simplifiedSubgraphAction.ts
import { SubgraphBuilder } from "../SubgraphBuilder";
import { ResearchAgent, AnalysisAgent, SynthesisAgent } from "./subgraphAgents";

/**
 * Simplified Action Subgraph using SubgraphBuilder
 * 
 * Demonstrates the power of the builder pattern:
 * - 90% less boilerplate code
 * - Intuitive method chaining
 * - Built-in error handling and retry logic
 * - Automatic state management
 * - Zero LangGraph knowledge required
 */

// Linear Flow Example - Simple chain of agents
export const ActionSubgraph = SubgraphBuilder
  .create("ActionSubgraph")
  .start(ResearchAgent)
  .then(AnalysisAgent, { temperature: 0.2, maxTokens: 1000 })
  .then(SynthesisAgent)
  .withConfig({
    errorStrategy: "fallback",
    timeout: 30000,
    retries: 2
  })
  .build();

// Conditional Flow Example - Branch based on validation
export const ConditionalProcessingSubgraph = SubgraphBuilder
  .create("ConditionalProcessing")
  .start(ResearchAgent)
  .branch({
    condition: (state) => state.actionResults.length > 0,
    ifTrue: AnalysisAgent,
    ifFalse: SynthesisAgent
  })
  .build();

// Switch Flow Example - Multiple conditions routing
export const MultiPathSubgraph = SubgraphBuilder
  .create("MultiPath")
  .start(ResearchAgent)
  .switch({
    condition: (state) => {
      // Determine complexity based on task content
      const currentTask = state.tasks[state.currentTaskIndex];
      if (currentTask?.includes("complex") || currentTask?.includes("detailed")) {
        return "complex";
      } else if (currentTask?.includes("simple") || currentTask?.includes("basic")) {
        return "simple";
      }
      return "standard";
    },
    cases: {
      "complex": AnalysisAgent,
      "simple": SynthesisAgent,
      "standard": AnalysisAgent
    },
    default: SynthesisAgent
  })
  .withConfig({
    errorStrategy: "retry",
    retries: 3
  })
  .build();

/**
 * Usage Examples:
 * 
 * // Basic execution (same as original)
 * const result = await ActionSubgraph.execute(state, config);
 * 
 * // Access compiled subgraph for advanced use
 * const compiled = ActionSubgraph.getCompiledSubgraph();
 * 
 * // Can be used directly in ReactAgentBuilder
 * const reactAgent = new ReactAgentBuilder(config)
 *   .replaceActionNode(ActionSubgraph)
 *   .buildGraph();
 */

// Export for backward compatibility
export { ActionSubgraph as SimplifiedActionSubgraph };
