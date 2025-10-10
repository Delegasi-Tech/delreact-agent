import dotenv from "dotenv";
import { ReactAgentBuilder } from "../core/index";
dotenv.config();

/**
 * Test SSE MCP Integration
 * This example demonstrates using SSE-based MCP servers (like yfinance-mcp)
 * alongside traditional stdio MCP servers
 */
async function testMcpSSE() {
  console.log("🚀 Testing SSE MCP Integration with DelReact\n");

  const agent = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    openaiKey: process.env.OPENAI_KEY,
    useEnhancedPrompt: true,
    mcp: {
      servers: [
        // SSE-based MCP server (yfinance)
        {
          name: "saham-apayak",
          transport: 'sse',
          url: "https://yfinance-mcp.ans4175.workers.dev/sse"
        },
        // Optional: stdio-based MCP server for comparison
        // Uncomment if you want to test both transports together
        // {
        //   name: "filesystem",
        //   command: "npx",
        //   args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()]
        // }
      ],
      autoRegister: true,
      operationTimeout: 30000
    }
  })
  .init({
    selectedProvider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.7,
    maxTasks: 8
  })
  .build();

  try {
    // Check MCP connection status
    const mcpStatus = agent.getMcpStatus();
    console.log("📊 MCP Server Status:", mcpStatus);
    console.log("");

    // Test 1: Basic stock information retrieval
    console.log("Test 1: Basic Stock Information");
    console.log("─".repeat(50));
    const result1 = await agent.invoke({
      objective: "Get the current stock price and basic information for GOTO (Goto TBk.)",
      outputInstruction: "Summarize current price and trend signal"
    });
    console.log("✅ Result:", result1.conclusion);
    console.log("");

    // Test 2: Multi-stock comparison
    console.log("Test 2: Multi-Stock Comparison");
    console.log("─".repeat(50));
    const result2 = await agent.invoke({
      objective: "Compare the stock performance of GOTO and BUKA in past 20d",
      outputInstruction: "Create a comparison table with: symbol, current price, signal and brief insight"
    });
    console.log("✅ Result:", result2.conclusion);
    console.log("");

    // Test 3: Market analysis
    console.log("Test 3: Market Analysis");
    console.log("─".repeat(50));
    const result3 = await agent.invoke({
      objective: "Check Screening for top gainers recently",
      outputInstruction: "Include: current metrics, recent performance, and potential outlook"
    });
    console.log("✅ Result:", result3.conclusion);
    console.log("");

    console.log("✅ All SSE MCP tests completed successfully!");

  } catch (error) {
    console.error("❌ Error during MCP SSE test:", error);
    throw error;
  } finally {
    // Cleanup MCP connections
    // await agent.cleanup();
    console.log("\n🧹 Cleaned up MCP connections");
  }
}

// Run the test
testMcpSSE().catch(console.error);
