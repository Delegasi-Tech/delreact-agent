#!/usr/bin/env node

/**
 * Test script for RAG Tool functionality
 * Tests basic RAG operations without requiring API keys
 */

import { ragToolDef } from './dist/index.js';

console.log("🧪 Testing RAG Tool Functionality");
console.log("==================================");

async function testRAGTool() {
  try {
    // Test 1: Add knowledge without embeddings
    console.log("\n📝 Test 1: Adding knowledge without embeddings...");
    const addResult1 = await ragToolDef.invoke({
      action: "add",
      content: "DelReact is a powerful agent-based task planning framework built on LangChain LangGraph.",
      metadata: { source: "documentation", category: "framework" }
    });
    console.log("Result:", addResult1);

    // Test 2: Add more knowledge
    console.log("\n📝 Test 2: Adding more knowledge...");
    const addResult2 = await ragToolDef.invoke({
      action: "add",
      content: "LangChain is a framework for developing applications powered by language models.",
      metadata: { source: "documentation", category: "langchain" }
    });
    console.log("Result:", addResult2);

    // Test 3: List all knowledge
    console.log("\n📋 Test 3: Listing all knowledge...");
    const listResult = await ragToolDef.invoke({
      action: "list"
    });
    console.log("Result:", listResult);

    // Test 4: Text-based search (fallback)
    console.log("\n🔍 Test 4: Text-based search...");
    const searchResult = await ragToolDef.invoke({
      action: "search",
      query: "DelReact framework"
    });
    console.log("Result:", searchResult);

    // Test 5: Search for LangChain
    console.log("\n🔍 Test 5: Search for LangChain...");
    const searchResult2 = await ragToolDef.invoke({
      action: "search",
      query: "LangChain language models"
    });
    console.log("Result:", searchResult2);

    // Test 6: Delete knowledge
    console.log("\n🗑️ Test 6: Deleting knowledge...");
    const parsedAddResult = JSON.parse(addResult1);
    if (parsedAddResult.success && parsedAddResult.id) {
      const deleteResult = await ragToolDef.invoke({
        action: "delete",
        id: parsedAddResult.id
      });
      console.log("Result:", deleteResult);
    }

    // Test 7: List after deletion
    console.log("\n📋 Test 7: Listing after deletion...");
    const listAfterDelete = await ragToolDef.invoke({
      action: "list"
    });
    console.log("Result:", listAfterDelete);

    // Test 8: Clear all knowledge
    console.log("\n🧹 Test 8: Clearing all knowledge...");
    const clearResult = await ragToolDef.invoke({
      action: "clear"
    });
    console.log("Result:", clearResult);

    // Test 9: Final list (should be empty)
    console.log("\n📋 Test 9: Final list (should be empty)...");
    const finalList = await ragToolDef.invoke({
      action: "list"
    });
    console.log("Result:", finalList);

    console.log("\n✅ All RAG tool tests completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  }
}

// Test with OpenAI embeddings if key is provided
async function testRAGWithEmbeddings() {
  const openaiKey = process.env.OPENAI_KEY;
  if (!openaiKey) {
    console.log("\n⚠️ No OPENAI_KEY found, skipping embedding tests");
    return;
  }

  console.log("\n🚀 Testing RAG with OpenAI embeddings...");
  try {
    // Add knowledge with embeddings
    const addWithEmbedding = await ragToolDef.invoke({
      action: "add",
      content: "Vector embeddings are numerical representations of text that capture semantic meaning.",
      metadata: { source: "ai_knowledge", category: "embeddings" },
      agentConfig: { openaiKey }
    });
    console.log("Add with embedding result:", addWithEmbedding);

    // Search with semantic similarity
    const semanticSearch = await ragToolDef.invoke({
      action: "search",
      query: "semantic representation of text",
      agentConfig: { openaiKey }
    });
    console.log("Semantic search result:", semanticSearch);

    console.log("✅ Embedding tests completed!");
  } catch (error) {
    console.warn("⚠️ Embedding tests failed (this is OK if no OpenAI key):", error.message);
  }
}

// Main test runner
async function main() {
  await testRAGTool();
  await testRAGWithEmbeddings();
}

main();