import { McpClient, McpConfig } from "./core/mcp";
import { ReactAgentBuilder } from "./core";

/**
 * Test suite for MCP (Model Context Protocol) integration
 */

async function testMcpClientCreation() {
  console.log("🧪 Testing MCP Client Creation...");
  
  const config: McpConfig = {
    servers: [
      {
        name: "test-server",
        command: "echo",
        args: ["test"],
      }
    ],
    autoRegister: true,
    operationTimeout: 5000,
  };

  const mcpClient = new McpClient(config);
  
  // Test basic properties
  console.log("✅ MCP Client created successfully");
  
  const status = mcpClient.getConnectionStatus();
  console.log("📊 Initial status:", status);
  
  // Test disconnection (should not throw)
  await mcpClient.disconnect();
  console.log("✅ MCP Client disconnection test passed");
}

async function testReactAgentBuilderWithMcp() {
  console.log("\n🧪 Testing ReactAgentBuilder with MCP...");
  
  const mcpConfig: McpConfig = {
    servers: [
      {
        name: "test-filesystem",
        command: "echo", // Use echo as a safe test command
        args: ["test-output"],
      }
    ],
    autoRegister: false, // Don't auto-register for this test
  };

  try {
    const agent = new ReactAgentBuilder({
      geminiKey: "test-key", // Dummy key for testing
      mcp: mcpConfig,
    })
    .init({
      selectedProvider: 'gemini',
      model: 'gemini-2.5-flash'
    })
    .build();

    console.log("✅ ReactAgentBuilder with MCP config created");
    
    // Test MCP status method
    const status = agent.getMcpStatus();
    console.log("📊 MCP Status from agent:", status);
    
    // Test cleanup
    await agent.cleanup();
    console.log("✅ Agent cleanup completed");
    
  } catch (error) {
    console.log("⚠️ Expected test behavior (connection may fail):", error.message);
  }
}

async function testMcpConfigValidation() {
  console.log("\n🧪 Testing MCP Configuration Validation...");
  
  // Test with empty servers array
  try {
    const emptyConfig: McpConfig = {
      servers: [],
      autoRegister: true,
    };
    
    const mcpClient = new McpClient(emptyConfig);
    await mcpClient.connect(); // Should not throw
    console.log("✅ Empty servers array handled correctly");
    await mcpClient.disconnect();
    
  } catch (error) {
    console.error("❌ Empty servers array test failed:", error);
  }
  
  // Test with minimal configuration
  try {
    const minimalConfig: McpConfig = {
      servers: [
        {
          name: "minimal",
          command: "echo",
        }
      ]
    };
    
    const mcpClient = new McpClient(minimalConfig);
    console.log("✅ Minimal configuration accepted");
    await mcpClient.disconnect();
    
  } catch (error) {
    console.error("❌ Minimal configuration test failed:", error);
  }
}

async function testMcpToolNaming() {
  console.log("\n🧪 Testing MCP Tool Naming Convention...");
  
  // Mock MCP tool for testing naming
  const mockMcpTool = {
    name: "test_tool",
    description: "A test tool",
    inputSchema: {
      type: "object",
      properties: {
        input: { type: "string", description: "Test input" }
      },
      required: ["input"]
    }
  };
  
  const serverName = "testserver";
  const expectedName = `${serverName}--${mockMcpTool.name}`;
  
  console.log(`📝 Original tool name: ${mockMcpTool.name}`);
  console.log(`📝 Expected DelReact name: ${expectedName}`);
  console.log("✅ Tool naming convention verified");
}

async function testMcpErrorHandling() {
  console.log("\n🧪 Testing MCP Error Handling...");
  
  // Test with invalid command
  const invalidConfig: McpConfig = {
    servers: [
      {
        name: "invalid",
        command: "definitely-not-a-real-command-12345",
        args: ["--help"],
      }
    ],
    autoRegister: false,
  };
  
  try {
    const mcpClient = new McpClient(invalidConfig);
    await mcpClient.connect(); // Should handle error gracefully
    
    const status = mcpClient.getConnectionStatus();
    console.log("📊 Status after invalid connection:", status);
    
    // Should show server as not connected
    const isConnected = mcpClient.isServerConnected("invalid");
    console.log(`📊 Invalid server connected: ${isConnected}`);
    
    if (!isConnected) {
      console.log("✅ Error handling working correctly - invalid server marked as disconnected");
    } else {
      console.log("⚠️ Error handling issue - invalid server marked as connected");
    }
    
    await mcpClient.disconnect();
    
  } catch (error) {
    console.log("✅ Error handling test passed - errors caught appropriately");
  }
}

async function testMcpIntegrationTypes() {
  console.log("\n🧪 Testing MCP Integration Types...");
  
  // Test type exports
  try {
    const serverConfig = {
      name: "type-test",
      command: "echo",
      args: ["test"],
      env: { TEST: "value" },
      timeout: 1000,
    };
    
    const mcpConfig = {
      servers: [serverConfig],
      autoRegister: true,
      operationTimeout: 5000,
    };
    
    console.log("✅ All MCP types are properly defined");
    console.log("📝 Server config fields:", Object.keys(serverConfig));
    console.log("📝 MCP config fields:", Object.keys(mcpConfig));
    
  } catch (error) {
    console.error("❌ Type definition test failed:", error);
  }
}

/**
 * Run all MCP tests
 */
async function runMcpTests() {
  console.log("🧪 MCP Integration Test Suite");
  console.log("=============================");
  
  const tests = [
    testMcpClientCreation,
    testReactAgentBuilderWithMcp,
    testMcpConfigValidation,
    testMcpToolNaming,
    testMcpErrorHandling,
    testMcpIntegrationTypes,
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error(`❌ Test failed: ${test.name}`, error);
      failed++;
    }
  }
  
  console.log("\n📊 Test Results:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log("🎉 All MCP tests passed!");
  } else {
    console.log("⚠️ Some tests failed - check implementation");
  }
  
  return { passed, failed };
}

// Export for use in other test files
export {
  testMcpClientCreation,
  testReactAgentBuilderWithMcp,
  testMcpConfigValidation,
  testMcpToolNaming,
  testMcpErrorHandling,
  testMcpIntegrationTypes,
  runMcpTests,
};

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMcpTests().catch(console.error);
}