import dotenv from "dotenv";
import { ReactAgentBuilder } from "../dist/index.js";
dotenv.config();

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

/**
 * Test the new ActionSubgraph implementation
 * Demonstrates shared state compatibility between parent graph and subgraph
 */
async function testSharedState() {
  console.log("🚀 Testing ActionSubgraph with Shared State");
  console.log("=".repeat(60));

  // Test with original ActionAgent for comparison
  const agentBuilder = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    openaiKey: OPENAI_KEY,
    braveApiKey: BRAVE_API_KEY,
    useEnhancedPrompt: true
  });
  const agent = agentBuilder.init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash',
  }).build();

  const testObjective = "What is GDP of a second winner of 2022 World Cup?";
  const testOutputInstruction = "Present it in structured sections: Summary, GDP, Year, Country";

  try {
    console.log("\n📊 Testing Original ActionAgent...");
    const startTimeOriginal = Date.now();
    const resultOriginal = await agent.invoke({
      objective: testObjective,
      outputInstruction: testOutputInstruction,
    });
    const durationOriginal = Date.now() - startTimeOriginal;

    console.log("✅ Original ActionAgent completed");
    console.log(`⏱️  Duration: ${durationOriginal}ms`);
    console.log(`📄 Conclusion length: ${resultOriginal.conclusion?.length || 0} chars`);
    console.log(`🔄 Action results length: ${resultOriginal.fullState.actionResults.length} items`);

    // Show state compatibility
    console.log("\n🔍 State Actioned Result:");
    console.log("Original state results:", resultOriginal.fullState.actionResults.join(" ##\n"));

    // Show detailed results
    console.log("\n📝 Original ActionAgent Conclusion:");
    console.log("-".repeat(40));
    console.log(resultOriginal.conclusion);

  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

const main = async () => {
  await testSharedState();
};
main().catch(error => {
  console.error("Error running tests:", error);
});
