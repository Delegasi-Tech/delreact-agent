import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Test session memory functionality
 * Demonstrates that agents can recall previous conversations with the same sessionId
 */
async function testSessionMemory() {
  console.log("🧠 Testing Session Memory Feature");
  console.log("=" .repeat(60));

  // Create agent with session memory enabled
  const agentBuilder = new ReactAgentBuilder({
    geminiKey: GEMINI_KEY, 
    openaiKey: OPENAI_KEY,
    memory: "in-memory", // Use in-memory storage by default
    enableSessionPersistence: false, // Test with in-memory first
    useEnhancedPrompt: false // Disable for faster testing
  });

  const agent = agentBuilder.init({
    selectedProvider: 'openai',
    model: 'gpt-4o-mini',
    debug: false,
    maxTasks: 3,
  }).build();

  const sessionId = "test-session-memory-123";

  try {
    // First conversation
    console.log("\n📝 First conversation - Introducing myself...");
    const result1 = await agent.invoke({
      objective: "My name is Alice and I work as a software engineer. Please remember this about me.",
      sessionId: sessionId,
    });

    console.log("✅ First conversation completed");
    console.log(`📄 Conclusion: ${result1.conclusion}`);
    console.log(`🔄 Session ID: ${result1.sessionId}`);

    // Second conversation - should remember the previous info
    console.log("\n📝 Second conversation - Testing memory recall...");
    const result2 = await agent.invoke({
      objective: "What do you remember about me? What's my name and profession?",
      sessionId: sessionId, // Same session ID
    });

    console.log("✅ Second conversation completed");
    console.log(`📄 Conclusion: ${result2.conclusion}`);
    console.log(`🔄 Session ID: ${result2.sessionId}`);

    // Third conversation - Building on previous context
    console.log("\n📝 Third conversation - Building on context...");
    const result3 = await agent.invoke({
      objective: "Based on what you know about me, suggest 3 programming languages I should learn next.",
      sessionId: sessionId, // Same session ID
    });

    console.log("✅ Third conversation completed");
    console.log(`📄 Conclusion: ${result3.conclusion}`);
    console.log(`🔄 Session ID: ${result3.sessionId}`);

    // Test with different session ID - should not remember
    console.log("\n📝 Fourth conversation - Different session (should not remember)...");
    const result4 = await agent.invoke({
      objective: "Do you know anything about me? What's my name?",
      sessionId: "different-session-456", // Different session ID
    });

    console.log("✅ Fourth conversation completed");
    console.log(`📄 Conclusion: ${result4.conclusion}`);
    console.log(`🔄 Session ID: ${result4.sessionId}`);

    // Analyze results
    console.log("\n🔍 Session Memory Analysis:");
    console.log("-".repeat(40));
    
    const hasNameInResult2 = result2.conclusion?.toLowerCase().includes("alice") || false;
    const hasProfessionInResult2 = result2.conclusion?.toLowerCase().includes("software") || 
                                  result2.conclusion?.toLowerCase().includes("engineer") || false;
    
    const hasContextInResult3 = result3.conclusion?.toLowerCase().includes("alice") ||
                               result3.conclusion?.toLowerCase().includes("software") ||
                               result3.conclusion?.toLowerCase().includes("engineer") || false;
    
    const hasNoMemoryInResult4 = !result4.conclusion?.toLowerCase().includes("alice") &&
                                !result4.conclusion?.toLowerCase().includes("software engineer");

    console.log(`Memory Recall Test (Name): ${hasNameInResult2 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Memory Recall Test (Profession): ${hasProfessionInResult2 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Context Building Test: ${hasContextInResult3 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Session Isolation Test: ${hasNoMemoryInResult4 ? '✅ PASSED' : '❌ FAILED'}`);

    const allTestsPassed = hasNameInResult2 && hasProfessionInResult2 && hasContextInResult3 && hasNoMemoryInResult4;
    console.log(`\n🎯 Overall Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

  } catch (error: any) {
    console.error("❌ Test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

const main = async () => {
  await testSessionMemory();
};

main().catch(error => {
  console.error("Error running session memory test:", error);
});