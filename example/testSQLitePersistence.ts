import dotenv from "dotenv";
dotenv.config();

import { ReactAgentBuilder } from "../core";

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Test SQLite session persistence functionality
 * Demonstrates that session memory persists across agent rebuilds when using SQLite
 */
async function testSQLitePersistence() {
  console.log("💾 Testing SQLite Session Persistence");
  console.log("=" .repeat(60));

  const sessionId = "test-sqlite-persistence-456";

  try {
    // First agent instance with SQLite persistence
    console.log("\n🔧 Creating first agent instance with SQLite persistence...");
    const agentBuilder1 = new ReactAgentBuilder({
      geminiKey: GEMINI_KEY, 
      openaiKey: OPENAI_KEY,
      memory: "in-memory", // Base memory type
      enableSessionPersistence: true, // This will force SQLite for session storage
      useEnhancedPrompt: false
    });

    const agent1 = agentBuilder1.init({
      selectedProvider: 'openai',
      model: 'gpt-4o-mini',
      debug: false,
      maxTasks: 3,
    }).build();

    // Store information with first agent
    console.log("\n📝 First conversation - Storing user info...");
    const result1 = await agent1.invoke({
      objective: "My name is Bob and I am a data scientist who loves machine learning. Please remember this.",
      sessionId: sessionId,
    });

    console.log("✅ First conversation completed");
    console.log(`📄 Conclusion: ${result1.conclusion?.substring(0, 200)}...`);
    console.log(`🔄 Session ID: ${result1.sessionId}`);

    // Create a completely new agent instance (simulating restart)
    console.log("\n🔧 Creating second agent instance (simulating restart)...");
    const agentBuilder2 = new ReactAgentBuilder({
      geminiKey: GEMINI_KEY, 
      openaiKey: OPENAI_KEY,
      memory: "in-memory", // Base memory type
      enableSessionPersistence: true, // This will force SQLite for session storage
      useEnhancedPrompt: false
    });

    const agent2 = agentBuilder2.init({
      selectedProvider: 'openai',
      model: 'gpt-4o-mini',
      debug: false,
      maxTasks: 3,
    }).build();

    // Test memory recall with second agent
    console.log("\n📝 Second conversation - Testing persistence...");
    const result2 = await agent2.invoke({
      objective: "What do you remember about me? What is my name and profession?",
      sessionId: sessionId, // Same session ID
    });

    console.log("✅ Second conversation completed");
    console.log(`📄 Conclusion: ${result2.conclusion}`);
    console.log(`🔄 Session ID: ${result2.sessionId}`);

    // Test with yet another agent instance
    console.log("\n🔧 Creating third agent instance...");
    const agentBuilder3 = new ReactAgentBuilder({
      geminiKey: GEMINI_KEY, 
      openaiKey: OPENAI_KEY,
      memory: "in-memory",
      enableSessionPersistence: true,
      useEnhancedPrompt: false
    });

    const agent3 = agentBuilder3.init({
      selectedProvider: 'openai',
      model: 'gpt-4o-mini',
      debug: false,
      maxTasks: 3,
    }).build();

    // Build on previous knowledge
    console.log("\n📝 Third conversation - Building on persistent memory...");
    const result3 = await agent3.invoke({
      objective: "Based on what you know about me, recommend 3 machine learning frameworks I should explore.",
      sessionId: sessionId, // Same session ID
    });

    console.log("✅ Third conversation completed");
    console.log(`📄 Conclusion: ${result3.conclusion}`);

    // Analyze results
    console.log("\n🔍 SQLite Persistence Analysis:");
    console.log("-".repeat(40));
    
    const hasNameInResult2 = result2.conclusion?.toLowerCase().includes("bob") || false;
    const hasProfessionInResult2 = result2.conclusion?.toLowerCase().includes("data scientist") || 
                                  result2.conclusion?.toLowerCase().includes("machine learning") || false;
    
    const hasContextInResult3 = result3.conclusion?.toLowerCase().includes("bob") ||
                               result3.conclusion?.toLowerCase().includes("data scientist") ||
                               result3.conclusion?.toLowerCase().includes("machine learning") || false;

    console.log(`SQLite Name Persistence: ${hasNameInResult2 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`SQLite Profession Persistence: ${hasProfessionInResult2 ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`SQLite Context Building: ${hasContextInResult3 ? '✅ PASSED' : '❌ FAILED'}`);

    const allTestsPassed = hasNameInResult2 && hasProfessionInResult2 && hasContextInResult3;
    console.log(`\n🎯 SQLite Persistence Result: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);

    // Check SQLite files were created
    const fs = await import('fs');
    const path = await import('path');
    const dbDir = path.join(process.cwd(), '.delreact-memory');
    const sessionsFile = path.join(dbDir, 'sessions.json');
    
    console.log(`\n📁 SQLite Files Check:`);
    console.log(`Directory exists: ${fs.existsSync(dbDir) ? '✅' : '❌'}`);
    console.log(`Sessions file exists: ${fs.existsSync(sessionsFile) ? '✅' : '❌'}`);
    
    if (fs.existsSync(sessionsFile)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      console.log(`Session data stored: ${sessionId in sessionData ? '✅' : '❌'}`);
      if (sessionId in sessionData) {
        console.log(`Conversation history entries: ${sessionData[sessionId].conversationHistory?.length || 0}`);
      }
    }

  } catch (error: any) {
    console.error("❌ SQLite persistence test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

const main = async () => {
  await testSQLitePersistence();
};

main().catch(error => {
  console.error("Error running SQLite persistence test:", error);
});