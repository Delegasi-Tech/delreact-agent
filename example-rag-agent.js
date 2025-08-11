#!/usr/bin/env node

/**
 * Example: Using RAG tool with DelReact agents
 * Shows how to integrate RAG functionality into agent workflows
 */

import { ReactAgentBuilder } from './dist/index.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function demonstrateRAGWithAgent() {
  console.log("🚀 DelReact RAG Tool Integration Example");
  console.log("========================================");

  // Check for required API keys
  if (!process.env.GEMINI_KEY && !process.env.OPENAI_KEY) {
    console.log("❌ No API keys found. Please set GEMINI_KEY or OPENAI_KEY in your .env file");
    console.log("For demonstration purposes, we'll show the tool calls without LLM integration.");
    return;
  }

  try {
    // Initialize agent with RAG capabilities
    const agent = new ReactAgentBuilder({
      geminiKey: process.env.GEMINI_KEY,
      openaiKey: process.env.OPENAI_KEY,
      useEnhancedPrompt: true,
      memory: "in-memory",
      sessionId: "rag-demo-session"
    })
    .init({
      selectedProvider: process.env.GEMINI_KEY ? 'gemini' : 'openai',
      model: process.env.GEMINI_KEY ? 'gemini-2.0-flash-exp' : 'gpt-4o-mini'
    })
    .build();

    console.log("\n📝 Step 1: Adding knowledge to RAG system...");
    
    // First, let the agent add some knowledge
    const addKnowledgeResult = await agent.invoke({
      objective: "Add knowledge about DelReact framework using the RAG tool",
      prompt: `Use the RAG tool to add the following knowledge:
      
      Content: "DelReact is a powerful agent-based task planning framework built on LangChain LangGraph. It provides ReactAgentBuilder for multi-provider LLM support, SubgraphBuilder for context-safe execution, BaseAgent pattern for extensible architecture, Tool System with registry-based management, Memory Support with multiple backends, and Dynamic Replanning capabilities."
      
      Metadata: source="documentation", category="framework", version="1.2.0"
      
      Please use the rag-knowledge tool to add this information.`
    });

    console.log("✅ Knowledge addition result:", addKnowledgeResult.conclusion);

    console.log("\n🔍 Step 2: Searching for knowledge...");
    
    // Now search for knowledge about the framework
    const searchResult = await agent.invoke({
      objective: "Search for information about DelReact using the RAG tool",
      prompt: `Use the RAG tool to search for information about "DelReact framework capabilities". Then provide a summary of what you found.`
    });

    console.log("✅ Search result:", searchResult.conclusion);

    console.log("\n📊 Step 3: Listing all knowledge...");
    
    // List all knowledge
    const listResult = await agent.invoke({
      objective: "List all available knowledge in the RAG system",
      prompt: `Use the RAG tool to list all available knowledge items and provide a summary of the knowledge base contents.`
    });

    console.log("✅ Knowledge base summary:", listResult.conclusion);

    console.log("\n🧠 Step 4: Advanced search with context...");
    
    // Perform a more complex search and reasoning task
    const advancedResult = await agent.invoke({
      objective: "Find and analyze DelReact's key features",
      prompt: `Using the RAG tool, search for information about DelReact's features and capabilities. 
      Then analyze and categorize the features into:
      1. Core Architecture Components
      2. LLM Integration Features  
      3. Development Tools
      4. Advanced Capabilities
      
      Provide a well-structured analysis based on the RAG search results.`
    });

    console.log("✅ Advanced analysis:", advancedResult.conclusion);

    console.log("\n🎉 RAG Integration Demo Completed Successfully!");
    console.log("\nKey Benefits Demonstrated:");
    console.log("• Persistent knowledge storage across agent sessions");
    console.log("• Semantic search capabilities (when OpenAI key provided)");
    console.log("• Contextual information retrieval for better reasoning");
    console.log("• Integration with existing DelReact agent workflows");

  } catch (error) {
    console.error("❌ Demo failed:", error.message);
    console.error("Full error:", error);
  }
}

// Run the demonstration
demonstrateRAGWithAgent();