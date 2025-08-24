import { ReactAgentBuilder } from "../core/index.js";
import { SQLiteStorage } from "../core/memory/sqlite.js";
import * as fs from "fs";
import * as path from "path";

// Test custom memory path functionality directly
async function testCustomMemoryPathDirect() {
  console.log("🧪 Testing SQLite custom path directly...");
  
  const customPath = "/tmp/delreact-test-direct";
  
  // Clean up any existing test directory
  if (fs.existsSync(customPath)) {
    fs.rmSync(customPath, { recursive: true });
  }
  
  try {
    // Test SQLite storage directly with custom path
    const storage = new SQLiteStorage(undefined, customPath);
    
    console.log("✅ SQLite storage created with custom path");
    
    // Check if the custom directory was created
    if (fs.existsSync(customPath)) {
      console.log(`✅ Custom memory directory created at: ${customPath}`);
      
      // Check for expected files
      const sessionsFile = path.join(customPath, 'sessions.json');
      const toolsFile = path.join(customPath, 'tools.json');
      
      if (fs.existsSync(sessionsFile)) {
        console.log("✅ Sessions file created in custom path");
      }
      
      if (fs.existsSync(toolsFile)) {
        console.log("✅ Tools file created in custom path");
      }
      
      // List directory contents
      const files = fs.readdirSync(customPath);
      console.log(`📁 Custom directory contents: ${files.join(', ')}`);
      
      // Test storing a session
      const testSession = {
        sessionId: "test-123",
        previousConclusions: ["Test conclusion"],
        conversationHistory: [{
          objective: "Test objective",
          conclusion: "Test result",
          timestamp: Date.now()
        }],
        lastUpdated: Date.now()
      };
      
      await storage.storeSession(testSession);
      console.log("✅ Test session stored successfully");
      
      // Test retrieving the session
      const retrieved = await storage.retrieveSession("test-123");
      if (retrieved && retrieved.sessionId === "test-123") {
        console.log("✅ Test session retrieved successfully");
      } else {
        console.log("❌ Failed to retrieve test session");
      }
      
    } else {
      console.log("❌ Custom memory directory was not created");
    }
    
  } catch (error) {
    console.error("❌ Direct test failed:", error);
  } finally {
    // Clean up test directory
    if (fs.existsSync(customPath)) {
      fs.rmSync(customPath, { recursive: true });
      console.log("🧹 Cleaned up test directory");
    }
  }
}

// Test PostgreSQL storage implementation (without actually connecting)
async function testPostgreSQLImplementation() {
  console.log("\n🧪 Testing PostgreSQL storage implementation...");
  
  try {
    const { PostgresStorage } = await import("../core/memory/postgres.js");
    
    console.log("✅ PostgreSQL storage class imported successfully");
    console.log("✅ PostgreSQL implementation is available but not integrated");
    
    // Test without actual connection - should not try to connect immediately
    const storage = new PostgresStorage();
    console.log("✅ PostgreSQL storage constructor works without connection string");
    
    // Test with invalid connection string
    try {
      const storageWithConnection = new PostgresStorage("postgresql://test:test@localhost:5432/test");
      console.log("✅ PostgreSQL storage constructor accepts connection string");
    } catch (error) {
      console.log("⚠️ PostgreSQL storage constructor error:", error.message);
    }
    
  } catch (error) {
    console.error("❌ PostgreSQL test failed:", error);
  }
}

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  testCustomMemoryPathDirect()
    .then(() => testPostgreSQLImplementation())
    .then(() => {
      console.log("\n🎉 All tests completed!");
    })
    .catch(console.error);
}

export { testCustomMemoryPathDirect, testPostgreSQLImplementation };