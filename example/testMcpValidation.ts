import { ReactAgentBuilder } from "../core/index";
import dotenv from "dotenv";

dotenv.config();

/**
 * Test MCP Configuration Validation
 * This example demonstrates proper error handling for invalid MCP configurations
 */
async function testMcpValidation() {
  console.log("🧪 Testing MCP Configuration Validation\n");

  // Test 1: Invalid config - neither url nor command provided
  console.log("Test 1: Invalid Config (no url or command)");
  console.log("─".repeat(50));
  try {
    const agent1 = new ReactAgentBuilder({
      geminiKey: process.env.GEMINI_KEY,
      mcp: {
        servers: [
          {
            name: "invalid-server",
            // Missing both url and command - should fail
          } as any
        ]
      }
    })
    .init({ selectedProvider: 'gemini' })
    .build();

    await agent1.invoke({ objective: "test" });
    console.log("❌ Test FAILED: Should have thrown validation error");
  } catch (error: any) {
    console.log("✅ Test PASSED: Caught expected error");
    console.log(`   Error: ${error.message}`);
  }
  console.log("");

  // Test 2: Invalid SSE config - transport specified but no url
  console.log("Test 2: Invalid SSE Config (transport=sse but no url)");
  console.log("─".repeat(50));
  try {
    const agent2 = new ReactAgentBuilder({
      geminiKey: process.env.GEMINI_KEY,
      mcp: {
        servers: [
          {
            name: "invalid-sse",
            transport: 'sse' as const,
            // Missing url - should fail
          } as any
        ]
      }
    })
    .init({ selectedProvider: 'gemini' })
    .build();

    await agent2.invoke({ objective: "test" });
    console.log("❌ Test FAILED: Should have thrown validation error");
  } catch (error: any) {
    console.log("✅ Test PASSED: Caught expected error");
    console.log(`   Error: ${error.message}`);
  }
  console.log("");

  // Test 3: Invalid stdio config - transport specified but no command
  console.log("Test 3: Invalid Stdio Config (transport=stdio but no command)");
  console.log("─".repeat(50));
  try {
    const agent3 = new ReactAgentBuilder({
      geminiKey: process.env.GEMINI_KEY,
      mcp: {
        servers: [
          {
            name: "invalid-stdio",
            transport: 'stdio' as const,
            // Missing command - should fail
          } as any
        ]
      }
    })
    .init({ selectedProvider: 'gemini' })
    .build();

    await agent3.invoke({ objective: "test" });
    console.log("❌ Test FAILED: Should have thrown validation error");
  } catch (error: any) {
    console.log("✅ Test PASSED: Caught expected error");
    console.log(`   Error: ${error.message}`);
  }
  console.log("");

  // Test 4: Valid SSE config - should succeed
  console.log("Test 4: Valid SSE Config");
  console.log("─".repeat(50));
  try {
    const agent4 = new ReactAgentBuilder({
      geminiKey: process.env.GEMINI_KEY,
      mcp: {
        servers: [
          {
            name: "yfinance",
            transport: 'sse',
            url: "https://your-mcp-server.example.com/sse"
          }
        ]
      }
    })
    .init({ selectedProvider: 'gemini' })
    .build();

    const status = agent4.getMcpStatus();
    console.log("✅ Test PASSED: Valid config accepted");
    console.log(`   Connection Status:`, status);
    await agent4.cleanup();
  } catch (error: any) {
    console.log("❌ Test FAILED: Valid config should not throw error");
    console.log(`   Error: ${error.message}`);
  }
  console.log("");

  // Test 5: Valid stdio config - should succeed
  console.log("Test 5: Valid Stdio Config (auto-detect)");
  console.log("─".repeat(50));
  try {
    const agent5 = new ReactAgentBuilder({
      geminiKey: process.env.GEMINI_KEY,
      mcp: {
        servers: [
          {
            name: "filesystem",
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()]
          }
        ]
      }
    })
    .init({ selectedProvider: 'gemini' })
    .build();

    const status = agent5.getMcpStatus();
    console.log("✅ Test PASSED: Valid stdio config accepted");
    console.log(`   Connection Status:`, status);
    await agent5.cleanup();
  } catch (error: any) {
    console.log("❌ Test FAILED: Valid config should not throw error");
    console.log(`   Error: ${error.message}`);
  }
  console.log("");

  console.log("🎉 All validation tests completed!");
}

// Run the validation tests
testMcpValidation().catch(console.error);
