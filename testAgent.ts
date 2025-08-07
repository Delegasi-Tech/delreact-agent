import dotenv from "dotenv";

import { ReactAgentBuilder } from "./core";
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
  console.log("=" .repeat(60));

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

  const testObjective = "Use this workflow: find persona and pain for new product regarding Jeans Denim for young adults -> create 3 hooks -> elaborate thos hooks into stories and caption -> make a complete content planner with that 3 hooks in Bahasa Indonesia";
  const testOutputInstruction = "Present it in structured sections: Persona (Demographic, Psychographic, Pain Points), Hooks, Stories, Content Planner";

  // const testObjective = "Use web search to analyze IHSG Stock News?";

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

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

/**
 * Test state channel compatibility
 */
async function testStateChannelCompatibility() {
  console.log("\n🧪 Testing State Channel Compatibility");
  console.log("=" .repeat(60));

  const agent = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY,
    useSubgraph: true
  });

  try {
    // Test with complex state scenario
    const result = await agent.invoke({
      objective: "Create a simple 3-step process for onboarding new team members",
      outputInstruction: "Numbered list with timelines",
      sessionId: "test-compatibility-session"
    });

    console.log("✅ State compatibility test passed");
    console.log("📊 Final state structure:");
    
    const state = result.fullState;
    console.log({
      objective: !!state.objective,
      tasks: state.tasks.length,
      currentTaskIndex: state.currentTaskIndex,
      actionResults: state.actionResults.length,
      actionedTasks: state.actionedTasks.length,
      objectiveAchieved: state.objectiveAchieved,
      conclusion: !!state.conclusion
    });

    // Verify all required channels are present and valid
    const requiredChannels = ['objective', 'tasks', 'currentTaskIndex', 'actionResults', 'actionedTasks', 'objectiveAchieved'];
    const missingChannels = requiredChannels.filter(channel => !(channel in state));
    
    if (missingChannels.length === 0) {
      console.log("✅ All required state channels present");
    } else {
      console.log("❌ Missing channels:", missingChannels);
    }

  } catch (error: any) {
    console.error("❌ State compatibility test failed:", error.message);
  }
}

const main = async () => {
  await testSharedState();
//   await testStateChannelCompatibility();
};
main().catch(error => {
  console.error("Error running tests:", error);
});
