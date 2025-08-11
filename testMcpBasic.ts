import { ReactAgentBuilder } from "./core";

/**
 * Simple test to verify MCP integration works
 */
async function testMcpBasicFunctionality() {
  console.log("🧪 Testing Basic MCP Functionality");
  
  // Create agent with MCP config (using echo command for safety)
  const agent = new ReactAgentBuilder({
    geminiKey: "test-key",
    mcp: {
      servers: [
        {
          name: "test",
          command: "echo",
          args: ["hello"],
        }
      ],
      autoRegister: false,
    }
  })
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash'
  })
  .build();

  console.log("✅ Agent created with MCP config");
  
  // Test MCP status
  const status = agent.getMcpStatus();
  console.log("📊 MCP Status:", status);
  
  // Test cleanup
  await agent.cleanup();
  console.log("✅ Cleanup successful");
}

testMcpBasicFunctionality().catch(console.error);