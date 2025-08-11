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
        name: "filesystem",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
        env: {},
      },
      // You can add more MCP servers here
      // {
      //   name: "git",
      //   command: "npx", 
      //   args: ["-y", "@modelcontextprotocol/server-git", process.cwd()],
      // },
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
    const mcpStatus = agent.getMcpStatus();
    console.log("🔍 MCP Server Status:", mcpStatus);

    if (mcpStatus && Object.values(mcpStatus).some(connected => connected)) {
      console.log("✅ At least one MCP server is connected");
      
      // Test the agent with a filesystem-related task
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
      console.log("- They are prefixed with server name (e.g., 'filesystem--read_file')");
      console.log("- Tools integrate seamlessly with existing DelReact tools");
      
    } else {
      console.log("⚠️ No MCP servers connected. This might be because:");
      console.log("- MCP servers are not installed (run: npm install -g @modelcontextprotocol/server-filesystem)");
      console.log("- Server configuration is incorrect");
      console.log("- Servers failed to start");
      
      console.log("\n📝 To install MCP servers:");
      console.log("npm install -g @modelcontextprotocol/server-filesystem");
      console.log("npm install -g @modelcontextprotocol/server-git");
      
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
      console.log("npm install -g @modelcontextprotocol/server-filesystem");
    }
  } finally {
    // Important: Cleanup MCP connections
    if (agent) {
      console.log("\n🧹 Cleaning up MCP connections...");
      await agent.cleanup();
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
          name: "filesystem",
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
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
    
    await agent.cleanup();
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
    
    await agent.cleanup();
    
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

// Only run if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}

export { mcpExample, advancedMcpExample, errorHandlingExample };