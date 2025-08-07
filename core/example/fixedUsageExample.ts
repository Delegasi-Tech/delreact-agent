// src/core/example/fixedUsageExample.ts
/**
 * Example of the correct way to use SubgraphBuilder after the context fix
 */

import { SubgraphBuilder } from "../SubgraphBuilder";
import { ResearchAgent, AnalysisAgent, SynthesisAgent } from "./subgraphAgents";
import { AgentState } from "../agentState";

// Create the subgraph
const ActionSubgraph = SubgraphBuilder
  .create("ActionSubgraph")
  .start(ResearchAgent)
  .then(AnalysisAgent)
  .then(SynthesisAgent)
  .withConfig({
    errorStrategy: "fallback",
    timeout: 30000,
    retries: 2
  })
  .build();

// Test function to verify the fix
export async function testFixedSubgraph() {
  const mockState: AgentState = {
    objective: "Test the fixed subgraph execution",
    prompt: "Test prompt",
    outputInstruction: "Test output",
    tasks: ["research remote work", "analyze benefits", "summarize findings"],
    currentTaskIndex: 0,
    actionResults: [],
    actionedTasks: [],
    objectiveAchieved: false,
    conclusion: undefined
  };

  const mockConfig = {
    configurable: {
      selectedProvider: "gemini",
      selectedKey: "test-key",
      sessionId: "test-session"
    }
  };

  try {
    console.log("🧪 Testing fixed subgraph execution...");
    
    // This should now work without the "Cannot read properties of undefined" error
    const result = await ActionSubgraph.execute(mockState, mockConfig);
    
    console.log("✅ Subgraph execution completed successfully!");
    console.log("📊 Result keys:", Object.keys(result));
    
    return result;
    
  } catch (error: any) {
    console.error("❌ Subgraph execution failed:", error.message);
    throw error;
  }
}

// Export the working subgraph
export { ActionSubgraph };

// Usage with ReactAgentBuilder (this should now work correctly)
export function createReactAgentWithSubgraph(config: { geminiKey?: string; openaiKey?: string }) {
  const { ReactAgentBuilder } = require("../index");
  
  return new ReactAgentBuilder(config)
    .replaceActionNode(ActionSubgraph)  // This should now work without context issues
    .buildGraph();
}

// Alternative static method approach for even better compatibility
export class FixedActionSubgraph {
  private static compiledSubgraph = ActionSubgraph;
  
  // Static execute method that ensures proper context
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    return await FixedActionSubgraph.compiledSubgraph.execute(input, config);
  }
  
  // Get the compiled subgraph
  static getCompiledSubgraph() {
    return FixedActionSubgraph.compiledSubgraph.getCompiledSubgraph();
  }
}

console.log("✅ Fixed SubgraphBuilder usage examples loaded successfully");
console.log("🔧 The context binding fix should resolve the 'Cannot read properties of undefined' error");
