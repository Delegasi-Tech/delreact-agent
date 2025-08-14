import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";


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
  agentBuilder.on("finalEnhancement", (payload) => {
    console.log(`${payload.agent}:`, payload.data);
  });
  agentBuilder.on("taskBreakdown", (payload) => {
    console.log(`${payload.agent}:`, payload.data);
  });
  agentBuilder.on("taskReplan", (payload) => {
    console.log(`${payload.agent}:`, payload.data);
  });
  const agent = agentBuilder.init({
    selectedProvider: 'openai',
    model: 'gpt-4.1-mini',
    // selectedProvider: 'openrouter',
    // model: 'openai/gpt-4o-mini',
    // selectedProvider: 'gemini',
    // model: 'gemini-2.5-flash',
    debug: false,
    maxTasks: 10,
  }).build();

  // const testObjective = "Use this workflow: find persona and pain for new product regarding Jeans Denim for young adults -> create 3 hooks -> elaborate thos hooks into stories and caption -> make a complete content planner with that 3 hooks in Bahasa Indonesia";
  // const testOutputInstruction = "Present it in structured sections: Persona (Demographic, Psychographic, Pain Points), Hooks, Stories, Content Planner";

  // const testObjective = "Research and analyze CDIA Stock News Indonesia?";
  // const testOutputInstruction = "Present it in structured sections: Summary, Key Insights, Industry Insight, Market Impact, Future Outlook";const testObjective = "Research and analyze CDIA Stock News Indonesia?";

  const testObjective = "Analyze competitor pricing strategies in the Accounting SaaS market in Indonesia recently";
  const testOutputInstruction = "A JSON format object with properties: summary, insights, recommendations";

  // const testObjective = "Research and make narrative for ReAct AI Agent. What is their architecture, traits, and how they work. Check from numerous sources (i.e https://medium.com/@gauritr01/part-1-react-ai-agents-a-guide-to-smarter-ai-through-reasoning-and-action-d5841db39530) and summarize it in a concise way.";
  // const testOutputInstruction = "Present it in structured: 'What is ReAct AI Agent?', 'Distinct Architecture', 'How They Work', 'What is next evolution of ReAct AI Agent?'";

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

const main = async () => {
  await testSharedState();
};

main().catch(error => {
  console.error("Error running tests:", error);
});
