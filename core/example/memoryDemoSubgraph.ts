// src/core/example/memoryDemoSubgraph.ts
import { SubgraphBuilder } from "../SubgraphBuilder";
import { ResearchAgent, AnalysisAgent, SynthesisAgent } from "./subgraphAgents";

/**
 * Memory Demo Subgraph - Demonstrates cross-agent memory sharing using existing agents
 * 
 * Flow:
 * 1. ResearchAgent: Uses enhance-prompt + web-search tools, automatically stores results in memory
 * 2. AnalysisAgent: Creates structured insights from research data
 * 3. SynthesisAgent: Accesses stored memory data and provides final recommendations
 * 
 * Features:
 * - Uses existing proven agents (ResearchAgent, AnalysisAgent, SynthesisAgent)
 * - Automatic tool result storage via ToolRegistry memory wrapping
 * - Smart retrieval of memory references in tool arguments
 * - Clean agent separation without manual memory management
 */
export const MemoryDemoSubgraph = SubgraphBuilder
  .create("MemoryDemo")
  .start(ResearchAgent, { 
    temperature: 0.3, 
    maxTokens: 2000 
  })
  .then(AnalysisAgent, { 
    temperature: 0.2, 
    maxTokens: 1500 
  })
  .withConfig({
    errorStrategy: "fallback",
    timeout: 45000, // Longer timeout for web searches
    retries: 2
  })
  .build();

/**
 * Usage Example:
 * 
 * // In ReactAgentBuilder with memory-enabled tool storage
 * const agent = new ReactAgentBuilder({
 *   geminiKey,
 *   openaiKey,
 *   selectedProvider: "openai",
 *   memory: "in-memory"
 * }).replaceActionNode(MemoryDemoSubgraph);
 * 
 * const result = await agent.invoke({
 *   objective: "Research TypeScript patterns and provide recommendations",
 *   outputInstruction: "Demonstrate memory sharing: research → analysis → synthesis"
 * });
 * 
 * // Workflow:
 * // 1. ResearchAgent uses enhance-prompt + web-search, stores tool results automatically
 * // 2. AnalysisAgent processes research and creates structured insights
 * // 3. SynthesisAgent accesses stored data via smart retrieval and provides final recommendations
 */

// Export for different use cases
export { MemoryDemoSubgraph as MemoryShareSubgraph }; 