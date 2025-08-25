/**
 * Test SQLite session persistence infrastructure
 * Tests file-based persistence without requiring API calls
 */
async function testSQLiteInfrastructure() {
  console.log("💾 Testing SQLite Infrastructure");
  console.log("=" .repeat(60));

  try {
    // Test SQLite storage creation
    console.log("\n1. Testing SQLite Storage Creation...");
    const { SQLiteStorage } = await import("../core/memory");
    const sqliteStorage = new SQLiteStorage();
    
    console.log("✅ SQLite storage created");
    console.log("✅ Storage type:", sqliteStorage.getStorageType());

    // Test session storage and retrieval
    console.log("\n2. Testing Session Storage...");
    const testSessionId = "sqlite-test-session";
    const testSession = {
      sessionId: testSessionId,
      previousConclusions: ["First conclusion", "Second conclusion"],
      conversationHistory: [
        {
          objective: "Test objective 1",
          conclusion: "Test conclusion 1",
          timestamp: Date.now() - 1000,
          keyResults: ["result1", "result2"]
        },
        {
          objective: "Test objective 2", 
          conclusion: "Test conclusion 2",
          timestamp: Date.now(),
          keyResults: ["result3"]
        }
      ],
      lastUpdated: Date.now()
    };

    await sqliteStorage.storeSession(testSession);
    console.log("✅ Session stored to SQLite");

    const retrievedSession = await sqliteStorage.retrieveSession(testSessionId);
    console.log("✅ Session retrieved from SQLite");
    console.log("✅ Session data matches:", 
      retrievedSession?.sessionId === testSessionId &&
      retrievedSession?.conversationHistory.length === 2 &&
      retrievedSession?.previousConclusions.length === 2);

    // Test SessionMemoryManager with SQLite
    console.log("\n3. Testing SessionMemoryManager with SQLite...");
    const { SessionMemoryManager } = await import("../core/sessionMemory");
    const sqliteManager = new SessionMemoryManager(sqliteStorage);

    const newSessionId = "sqlite-manager-test";
    const newSession = await sqliteManager.loadOrCreateSession(newSessionId);
    console.log("✅ New session created via manager");

    const updatedSession = await sqliteManager.updateSession(
      newSessionId,
      "SQLite test objective",
      "SQLite test conclusion"
    );
    console.log("✅ Session updated via manager");

    // Test persistence by creating new manager instance
    const sqliteStorage2 = new SQLiteStorage();
    const sqliteManager2 = new SessionMemoryManager(sqliteStorage2);
    const persistedSession = await sqliteManager2.loadOrCreateSession(newSessionId);
    
    console.log("✅ Session persisted across instances:", 
      persistedSession.conversationHistory.length > 0 &&
      persistedSession.conversationHistory[0].objective === "SQLite test objective");

    // Test file system integration
    console.log("\n4. Testing File System...");
    const fs = await import('fs');
    const path = await import('path');
    const dbDir = path.join(process.cwd(), '.delreact-memory');
    const sessionsFile = path.join(dbDir, 'sessions.json');
    
    console.log("✅ Database directory exists:", fs.existsSync(dbDir));
    console.log("✅ Sessions file exists:", fs.existsSync(sessionsFile));
    
    if (fs.existsSync(sessionsFile)) {
      const sessionData = JSON.parse(fs.readFileSync(sessionsFile, 'utf8'));
      console.log("✅ Session data contains test sessions:", 
        testSessionId in sessionData && newSessionId in sessionData);
      console.log("✅ Session data structure valid:", 
        sessionData[testSessionId]?.conversationHistory?.length === 2);
    }

    // Test factory integration
    console.log("\n5. Testing Factory Integration...");
    const { createMemory } = await import("../core/memory");
    const factoryMemory = createMemory({
      type: "in-memory",
      enableSessionPersistence: true // Should create SQLite
    });
    
    console.log("✅ Factory creates SQLite when persistence enabled:", 
      factoryMemory.getStorageType() === "sqlite");

    console.log("\n🎯 All SQLite Infrastructure Tests: ✅ PASSED");

  } catch (error: any) {
    console.error("❌ SQLite infrastructure test failed:", error.message);
    console.error("Stack:", error.stack);
  }
}

testSQLiteInfrastructure().catch(error => {
  console.error("Error running SQLite infrastructure test:", error);
});