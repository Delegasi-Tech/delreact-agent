#!/usr/bin/env node

/**
 * DelReact RAG Enhanced Features Example
 * 
 * This example demonstrates the enhanced RAG capabilities:
 * 1. Loading knowledge from JSON and PDF files during ReactAgentBuilder initialization
 * 2. Bulk loading with pre-existing embeddings
 * 3. Agent workflows that leverage persistent knowledge
 * 4. Runtime knowledge additions
 */

const { ReactAgentBuilder, ragToolDef } = require('./core/index.ts');
const path = require('path');

async function demonstrateRAGEnhancements() {
  console.log("🚀 DelReact RAG Enhanced Features Demo\n");

  // ============================================================================
  // Scenario 1: Initialize ReactAgentBuilder with knowledge files
  // ============================================================================
  console.log("📚 Scenario 1: Initialize ReactAgentBuilder with knowledge files");
  
  const agentWithFiles = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    openaiKey: process.env.OPENAI_KEY,
    // Load knowledge files during initialization
    knowledgeFiles: [
      path.join(__dirname, 'example-knowledge.json'),
      path.join(__dirname, 'example-knowledge-with-embeddings.json')
    ],
    // Also add some initial knowledge items directly
    initialKnowledge: [
      {
        content: "DelReact supports memory backends including in-memory, PostgreSQL, and Redis for persistent conversations.",
        metadata: { source: "initialization", category: "memory" }
      },
      {
        content: "Tool registry enables dynamic tool availability based on agent configuration and runtime conditions.",
        metadata: { source: "initialization", category: "tools" }
      }
    ]
  })
  .init({ selectedProvider: 'gemini', model: 'gemini-1.5-flash' })
  .build();

  // ============================================================================
  // Scenario 2: Agent workflow leveraging the knowledge base
  // ============================================================================
  console.log("\n🤖 Scenario 2: Agent using pre-loaded knowledge");
  
  const knowledgeSearchResult = await agentWithFiles.invoke({
    objective: "Explain DelReact framework capabilities",
    prompt: "Search the knowledge base for information about DelReact and provide a comprehensive overview of its capabilities. Use the rag-knowledge tool to find relevant information."
  });

  console.log("Agent Response:", knowledgeSearchResult.conclusion);

  // ============================================================================
  // Scenario 3: Runtime knowledge additions during agent execution
  // ============================================================================
  console.log("\n📝 Scenario 3: Adding knowledge at runtime");
  
  const runtimeAddResult = await agentWithFiles.invoke({
    objective: "Add new knowledge about DelReact features",
    prompt: `Add this knowledge to our knowledge base using the rag-knowledge tool: 
    "DelReact supports event-driven architecture with EventEmitter for monitoring agent execution phases and custom event handling."
    Include metadata with source: "runtime" and category: "architecture".`
  });

  console.log("Runtime Addition Result:", runtimeAddResult.conclusion);

  // ============================================================================
  // Scenario 4: Direct tool usage for bulk operations
  // ============================================================================
  console.log("\n⚡ Scenario 4: Direct RAG tool usage for bulk operations");

  // Load a file directly
  console.log("Loading knowledge from file...");
  const fileLoadResult = await ragToolDef.invoke({
    action: "loadFile",
    filePath: path.join(__dirname, 'example-knowledge.json'),
    agentConfig: { openaiKey: process.env.OPENAI_KEY }
  });
  console.log("File Load Result:", JSON.parse(fileLoadResult));

  // Bulk load with embeddings
  console.log("\nBulk loading knowledge items...");
  const bulkLoadResult = await ragToolDef.invoke({
    action: "loadBulk",
    items: [
      {
        content: "Vector databases like Pinecone and Weaviate can be integrated for scalable semantic search.",
        metadata: { source: "bulk-demo", category: "scaling" }
      },
      {
        content: "Embedding models from OpenAI, Hugging Face, and other providers can be used for knowledge vectorization.",
        metadata: { source: "bulk-demo", category: "embeddings" },
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5] // Pre-computed embedding
      }
    ],
    agentConfig: { openaiKey: process.env.OPENAI_KEY }
  });
  console.log("Bulk Load Result:", JSON.parse(bulkLoadResult));

  // ============================================================================
  // Scenario 5: Search and knowledge management
  // ============================================================================
  console.log("\n🔍 Scenario 5: Knowledge search and management");

  // Search with semantic similarity
  const searchResult = await ragToolDef.invoke({
    action: "search",
    query: "framework architecture and design patterns",
    limit: 3,
    agentConfig: { openaiKey: process.env.OPENAI_KEY }
  });
  console.log("Search Results:", JSON.parse(searchResult));

  // List all knowledge
  const listResult = await ragToolDef.invoke({
    action: "list"
  });
  const listData = JSON.parse(listResult);
  console.log(`\nKnowledge Base Statistics: ${listData.total} items total`);

  // ============================================================================
  // Summary
  // ============================================================================
  console.log("\n✅ RAG Enhanced Features Summary:");
  console.log("• ✅ File loading (JSON/PDF/text) during ReactAgentBuilder initialization");
  console.log("• ✅ Bulk loading with pre-existing embeddings support");
  console.log("• ✅ Agent workflows leveraging persistent knowledge");
  console.log("• ✅ Runtime knowledge additions during execution");
  console.log("• ✅ Semantic search with OpenAI embeddings");
  console.log("• ✅ Fallback text search without embeddings");
  console.log("• ✅ Metadata-rich knowledge organization");
  console.log("• ✅ Session-persistent knowledge storage");

  console.log("\n🎯 Use Cases Supported:");
  console.log("1. Initialize agents with domain-specific knowledge from files");
  console.log("2. Load existing embeddings from JSON knowledge bases");
  console.log("3. Build compound knowledge bases that grow during runtime");
  console.log("4. Enable agents to search and reference stored knowledge");
  console.log("5. Support both semantic and keyword-based retrieval");
}

// Run the demo
if (require.main === module) {
  demonstrateRAGEnhancements().catch(console.error);
}

module.exports = { demonstrateRAGEnhancements };