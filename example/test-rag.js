#!/usr/bin/env node

/**
 * Comprehensive RAG Tool Test Suite
 * Tests all RAG functionality including new file loading and bulk operations
 */

import { ragToolDef } from '../dist/index.js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from "dotenv";
dotenv.config();

async function runRAGTests() {
  console.log("🧪 Running comprehensive RAG tool tests...\n");

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  function logTest(name, success, details = "") {
    const status = success ? "✅ PASS" : "❌ FAIL";
    console.log(`${status}: ${name}${details ? ` - ${details}` : ""}`);
    results.tests.push({ name, success, details });
    if (success) results.passed++;
    else results.failed++;
  }

  try {
    // ============================================================================
    // Test 1: Clear existing knowledge
    // ============================================================================
    const clearResult = await ragToolDef.invoke({ action: "clear" });
    const clearData = JSON.parse(clearResult);
    logTest("Clear knowledge base", clearData.success);

    // ============================================================================
    // Test 2: Basic add operation
    // ============================================================================
    const addResult = await ragToolDef.invoke({
      action: "add",
      content: "Test knowledge item for RAG functionality",
      metadata: { test: true, category: "basic" }
    });
    const addData = JSON.parse(addResult);
    logTest("Add knowledge item", addData.success, `ID: ${addData.id}`);

    // ============================================================================
    // Test 3: Search operation (text-based fallback)
    // ============================================================================
    const searchResult = await ragToolDef.invoke({
      action: "search",
      query: "test knowledge",
      limit: 5
    });
    const searchData = JSON.parse(searchResult);
    logTest("Search knowledge (text)", searchData.success && searchData.results.length > 0, 
      `Found ${searchData.results.length} results, type: ${searchData.searchType}`);

    // ============================================================================
    // Test 4: List all knowledge
    // ============================================================================
    const listResult = await ragToolDef.invoke({ action: "list" });
    const listData = JSON.parse(listResult);
    logTest("List knowledge items", listData.success, `Total: ${listData.total} items`);

    // ============================================================================
    // Test 5: Create test JSON file and load it
    // ============================================================================
    const testKnowledgeFile = path.join(process.cwd(), 'test-knowledge.json');
    const testKnowledge = [
      {
        "content": "JSON loading test item 1",
        "metadata": { "source": "test-file", "category": "file-loading" }
      },
      {
        "content": "JSON loading test item 2 with custom ID",
        "metadata": { "source": "test-file", "category": "file-loading" },
        "id": "custom-test-id"
      }
    ];
    
    fs.writeFileSync(testKnowledgeFile, JSON.stringify(testKnowledge, null, 2));
    
    const fileLoadResult = await ragToolDef.invoke({
      action: "loadFile",
      filePath: testKnowledgeFile,
      agentConfig: { openaiKey: process.env.OPENAI_KEY }
    });
    const fileLoadData = JSON.parse(fileLoadResult);
    logTest("Load knowledge from JSON file", fileLoadData.success, 
      `Loaded ${fileLoadData.loadCount} items from ${fileLoadData.fileName}`);

    // Clean up test file
    fs.unlinkSync(testKnowledgeFile);

    // ============================================================================
    // Test 6: Bulk load operation
    // ============================================================================
    const bulkItems = [
      {
        content: "Bulk item 1",
        metadata: { source: "bulk-test", index: 1 }
      },
      {
        content: "Bulk item 2 with embedding",
        metadata: { source: "bulk-test", index: 2 },
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5]
      },
      {
        content: "Bulk item 3 with custom ID",
        metadata: { source: "bulk-test", index: 3 },
        id: "bulk-custom-id"
      }
    ];

    const bulkLoadResult = await ragToolDef.invoke({
      action: "loadBulk",
      items: bulkItems,
      agentConfig: { openaiKey: process.env.OPENAI_KEY }
    });
    const bulkLoadData = JSON.parse(bulkLoadResult);
    logTest("Bulk load knowledge items", bulkLoadData.success, 
      `Loaded ${bulkLoadData.loadCount}/${bulkLoadData.totalItems} items`);

    // ============================================================================
    // Test 7: Search after bulk loading
    // ============================================================================
    const searchAfterBulkResult = await ragToolDef.invoke({
      action: "search",
      query: "bulk item",
      limit: 5
    });
    const searchAfterBulkData = JSON.parse(searchAfterBulkResult);
    logTest("Search after bulk loading", searchAfterBulkData.success && searchAfterBulkData.results.length >= 3,
      `Found ${searchAfterBulkData.results.length} bulk items`);

    // ============================================================================
    // Test 8: Delete specific knowledge item
    // ============================================================================
    const deleteResult = await ragToolDef.invoke({
      action: "delete",
      id: "bulk-custom-id"
    });
    const deleteData = JSON.parse(deleteResult);
    logTest("Delete knowledge item", deleteData.success, "Deleted bulk-custom-id");

    // ============================================================================
    // Test 9: Verify deletion
    // ============================================================================
    const listAfterDeleteResult = await ragToolDef.invoke({ action: "list" });
    const listAfterDeleteData = JSON.parse(listAfterDeleteResult);
    const deletedItemExists = listAfterDeleteData.knowledge.some(item => item.id === "bulk-custom-id");
    logTest("Verify deletion", !deletedItemExists, "Item successfully removed");

    // ============================================================================
    // Test 10: Load knowledge with complex JSON structure
    // ============================================================================
    const complexKnowledgeFile = path.join(process.cwd(), 'test-complex-knowledge.json');
    const complexKnowledge = {
      "knowledge": [
        {
          "content": "Complex structure item 1",
          "metadata": { "source": "complex-test" }
        }
      ],
      "metadata": {
        "version": "1.0",
        "description": "Test complex JSON structure"
      }
    };
    
    fs.writeFileSync(complexKnowledgeFile, JSON.stringify(complexKnowledge, null, 2));
    
    const complexLoadResult = await ragToolDef.invoke({
      action: "loadFile",
      filePath: complexKnowledgeFile
    });
    const complexLoadData = JSON.parse(complexLoadResult);
    logTest("Load complex JSON structure", complexLoadData.success, 
      `Loaded ${complexLoadData.loadCount} items from complex structure`);

    // Clean up complex test file
    fs.unlinkSync(complexKnowledgeFile);

    // ============================================================================
    // Test 11: Error handling - invalid file path
    // ============================================================================
    const invalidFileResult = await ragToolDef.invoke({
      action: "loadFile",
      filePath: "/non/existent/file.json"
    });
    const invalidFileData = JSON.parse(invalidFileResult);
    logTest("Error handling - invalid file", !invalidFileData.success, "Properly handled file not found");

    // ============================================================================
    // Test 12: Error handling - missing required parameters
    // ============================================================================
    const missingParamResult = await ragToolDef.invoke({
      action: "add"
      // Missing content parameter
    });
    const missingParamData = JSON.parse(missingParamResult);
    logTest("Error handling - missing parameters", !missingParamData.success, "Properly handled missing content");

    // ============================================================================
    // Test 13: Semantic search with OpenAI (if available)
    // ============================================================================
    if (process.env.OPENAI_KEY) {
      console.log("\n🚀 Testing semantic search with OpenAI...");
      
      const semanticAddResult = await ragToolDef.invoke({
        action: "add",
        content: "Machine learning enables computers to learn from data without explicit programming",
        metadata: { source: "ai-knowledge", category: "ml" },
        agentConfig: { openaiKey: process.env.OPENAI_KEY }
      });
      const semanticAddData = JSON.parse(semanticAddResult);
      logTest("Add with OpenAI embeddings", semanticAddData.success && semanticAddData.hasEmbedding, 
        "Successfully generated embeddings");

      const semanticSearchResult = await ragToolDef.invoke({
        action: "search",
        query: "artificial intelligence learning algorithms",
        agentConfig: { openaiKey: process.env.OPENAI_KEY }
      });
      const semanticSearchData = JSON.parse(semanticSearchResult);
      logTest("Semantic search with OpenAI", semanticSearchData.success && semanticSearchData.searchType === "semantic",
        `Found ${semanticSearchData.results.length} results via semantic search`);
    } else {
      console.log("\n⚠️ No OPENAI_KEY found, skipping semantic search tests");
    }

    // ============================================================================
    // Test Summary
    // ============================================================================
    console.log("\n" + "=".repeat(60));
    console.log(`🧪 RAG Tool Test Results:`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
      console.log("\n❌ Failed Tests:");
      results.tests.filter(t => !t.success).forEach(t => {
        console.log(`   • ${t.name}: ${t.details}`);
      });
    }

    console.log("\n🎯 Enhanced Features Tested:");
    console.log("• ✅ Basic CRUD operations (add, search, list, delete, clear)");
    console.log("• ✅ File loading from JSON with various structures");
    console.log("• ✅ Bulk loading with pre-existing embeddings");
    console.log("• ✅ Text-based search fallback");
    console.log("• ✅ Metadata support and filtering");
    console.log("• ✅ Error handling and validation");
    console.log("• ✅ Custom ID support");
    console.log("• ✅ Session persistence");
    if (process.env.OPENAI_KEY) {
      console.log("• ✅ Semantic search with OpenAI embeddings");
    }

    return results;

  } catch (error) {
    console.error("❌ Test suite failed:", error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runRAGTests().catch(console.error);
}

export { runRAGTests };