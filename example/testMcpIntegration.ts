import dotenv from "dotenv";
import { ReactAgentBuilder } from "../core";

dotenv.config();

const GEMINI_KEY = process.env.GEMINI_KEY;
const OPENAI_KEY = process.env.OPENAI_KEY;

/**
 * Example demonstrating MCP (Model Context Protocol) integration
 * This example shows how to connect to MCP servers and use their tools
 */
async function mcpExample() {
  console.log("🔌 MCP Integration Example");
  console.log("==========================");

  // Configure MCP servers
  const mcpConfig = {
    servers: [
      {
        name: "context7",
        command: "npx",
        args: ["-y", "@upstash/context7-mcp"],
        env: {},
      }
    ],
    autoRegister: true,
    operationTimeout: 30000, // 30 seconds
  };

  let agent;
  
  try {
    console.log("🚀 Creating agent with MCP configuration...");
    
    // Create agent with MCP configuration
    agent = new ReactAgentBuilder({
      geminiKey: GEMINI_KEY,
      openaiKey: OPENAI_KEY,
      memory: "in-memory",
      sessionId: "mcp-example-session",
      mcp: mcpConfig, // Add MCP configuration
    })
    .init({
      selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
      model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o-mini',
    })
    .build();

    console.log("✅ Agent created successfully");

    // Check MCP connection status
    const mcpStatus = await agent.getMcpStatus();
    console.log("🔍 MCP Server Status:", mcpStatus);

    if (mcpStatus && Object.values(mcpStatus).some(connected => connected)) {
      console.log("✅ At least one MCP server is connected");
      
      // Test the agent with a specific task to use MCP tools
      console.log("📋 Testing MCP integration...");
      
      const result = await agent.invoke({
        objective: "Analyze the current project structure. List the main directories and key files, focusing on TypeScript and documentation files. Provide insights about the project organization.",
        outputInstruction: "Provide a structured analysis of the project including main components, documentation, and overall organization."
      });

      console.log("🎯 Agent Response:");
      console.log("===================");
      console.log(result.conclusion);
      
      // Demonstrate MCP tool usage information
      console.log("\n📊 MCP Integration Information:");
      console.log("- Tools from MCP servers are automatically discovered and registered");
      console.log("- They are prefixed with server name (e.g., 'context7--get-library-docs')");
      console.log("- Tools integrate seamlessly with existing DelReact tools");
      
    } else {
      console.log("⚠️ No MCP servers connected. This might be because:");
      console.log("- MCP servers are not installed");
      console.log("- Server configuration is incorrect");
      console.log("- Servers failed to start");
      
      // Still test the agent without MCP tools
      console.log("\n🔧 Testing agent without MCP tools...");
      const result = await agent.invoke({
        objective: "Explain what MCP (Model Context Protocol) is and how it can benefit AI agents.",
        outputInstruction: "Provide a clear explanation suitable for developers."
      });
      
      console.log("🎯 Agent Response:");
      console.log("===================");
      console.log(result.conclusion);
    }

  } catch (error) {
    console.error("❌ Error running MCP example:", error);
    
    if (error.message.includes("spawn")) {
      console.log("\n💡 Tip: Make sure MCP servers are installed:");
    }
  } finally {
    // Important: Cleanup MCP connections
    if (agent) {
      console.log("\n🧹 Cleaning up MCP connections...");
      await agent.mcpCleanup();
      console.log("✅ Cleanup completed");
    }
  }
}

/**
 * Advanced MCP example showing manual MCP client usage
 */
async function advancedMcpExample() {
  console.log("\n🔧 Advanced MCP Example");
  console.log("========================");
  
  try {
    // Example of adding MCP servers after agent creation
    const agent = new ReactAgentBuilder({
      geminiKey: GEMINI_KEY,
      openaiKey: OPENAI_KEY,
    })
    .addMcpServers({
      servers: [
        {
          name: "context7",
          command: "npx",
          args: ["-y", "@upstash/context7-mcp"],
        }
      ],
      autoRegister: true,
    })
    .init({
      selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
      model: GEMINI_KEY ? 'gemini-2.5-flash' : 'gpt-4o-mini',
    })
    .build();

    console.log("✅ Agent with dynamically added MCP servers created");
    
    const status = agent.getMcpStatus();
    console.log("📊 MCP Status:", status);
    
    await agent.mcpCleanup();
    console.log("✅ Advanced example completed");
    
  } catch (error) {
    console.error("❌ Advanced MCP example error:", error);
  }
}

/**
 * Error handling example
 */
async function errorHandlingExample() {
  console.log("\n⚠️ MCP Error Handling Example");
  console.log("==============================");
  
  try {
    // Example with invalid MCP server configuration
    const agent = new ReactAgentBuilder({
      geminiKey: GEMINI_KEY,
      openaiKey: OPENAI_KEY,
      mcp: {
        servers: [
          {
            name: "invalid-server",
            command: "nonexistent-command",
            args: ["--invalid"],
          }
        ],
        autoRegister: true,
      }
    })
    .init({
      selectedProvider: GEMINI_KEY ? 'gemini' : 'openai',
    })
    .build();

    // Even with invalid MCP config, agent should still work
    const result = await agent.invoke({
      objective: "Test agent functionality with invalid MCP configuration",
      outputInstruction: "Confirm that the agent works despite MCP connection failures"
    });

    console.log("✅ Agent works despite MCP connection failures");
    console.log("📊 Result summary:", result.conclusion.substring(0, 200) + "...");
    
    await agent.mcpCleanup();
    
  } catch (error) {
    console.error("❌ Error handling example failed:", error);
  }
}

// Run examples
async function runExamples() {
  console.log("🎯 DelReact MCP Integration Examples");
  console.log("====================================");
  
  await mcpExample();
  await advancedMcpExample();
  await errorHandlingExample();
  
  console.log("\n🎉 All MCP examples completed!");
  console.log("\n📚 Next Steps:");
  console.log("1. Install additional MCP servers (git, sqlite, etc.)");
  console.log("2. Create custom MCP servers for your specific needs");
  console.log("3. Explore the MCP documentation for advanced features");
  console.log("4. Check out the DelReact MCP Integration Guide for more details");
}

runExamples().catch(error => {
  console.error("❌ Error running MCP examples:", error);
}).finally(() => {
  console.log("\n👋 Goodbye! Thank you for exploring DelReact MCP integration.");
});