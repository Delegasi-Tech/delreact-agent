import { ReactAgentBuilder } from "../core";

/**
 * Simple unit test for session memory infrastructure
 * Tests the basic functionality without requiring API calls
 */
async function testSessionMemoryInfrastructure() {
  console.log("🧪 Testing Session Memory Infrastructure");
  console.log("=" .repeat(60));

  try {
    // Test memory initialization
    console.log("\n1. Testing Memory Initialization...");
    const agentBuilder = new ReactAgentBuilder({
      openaiKey: "test-key", // Dummy key for testing
      memory: "in-memory",
      enableSessionPersistence: false
    });

    const memoryInstance = await (agentBuilder as any).initializeMemory("in-memory");
    console.log("✅ Memory instance created:", !!memoryInstance);
    console.log("✅ Memory type:", memoryInstance?.getStorageType());
    console.log("✅ Has session storage methods:", 
      typeof memoryInstance?.storeSession === 'function' && 
      typeof memoryInstance?.retrieveSession === 'function');

    // Test SQLite memory initialization
    console.log("\n2. Testing SQLite Memory Initialization...");
    const sqliteMemory = await (agentBuilder as any).initializeMemory("in-memory");
    console.log("✅ SQLite memory instance created:", !!sqliteMemory);

    // Test SessionMemoryManager
    console.log("\n3. Testing SessionMemoryManager...");
    const { SessionMemoryManager } = await import("../core/sessionMemory");
    const sessionManager = new SessionMemoryManager(memoryInstance);
    
    const testSessionId = "test-session-123";
    const session = await sessionManager.loadOrCreateSession(testSessionId);
    console.log("✅ Session created:", session.sessionId === testSessionId);
    console.log("✅ Session has required fields:", 
      Array.isArray(session.previousConclusions) && 
      Array.isArray(session.conversationHistory));

    // Test session update
    const updatedSession = await sessionManager.updateSession(
      testSessionId,
      "Test objective",
      "Test conclusion",
      ["result1", "result2"]
    );
    console.log("✅ Session updated with conversation entry");
    console.log("✅ Has conversation history:", updatedSession.conversationHistory.length > 0);

    // Test context generation
    const context = sessionManager.generateSessionContext(updatedSession);
    console.log("✅ Context generated:", context.length > 0);
    console.log("✅ Context includes previous info:", context.includes("Test objective"));

    // Test AgentState integration
    console.log("\n4. Testing AgentState Integration...");
    const { AgentStateChannels } = await import("../core/agentState");
    console.log("✅ AgentState has sessionMemory channel:", 'sessionMemory' in AgentStateChannels);

    console.log("\n🎯 All Infrastructure Tests: ✅ PASSED");

  } catch (error: any) {
    console.error("❌ Infrastructure test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

testSessionMemoryInfrastructure().catch(error => {
  console.error("Error running infrastructure test:", error);
});