import { tool } from "@langchain/core/tools";
import { OpenAIEmbeddings } from "@langchain/openai";
import z from "zod";
import * as fs from "fs";
import * as path from "path";

/**
 * RAG Knowledge Item
 */
export interface RAGKnowledgeItem {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  timestamp: number;
}

/**
 * RAG Storage Interface
 */
export interface RAGStorage {
  addKnowledge(item: RAGKnowledgeItem): Promise<void>;
  searchSimilar(query: string, queryEmbedding: number[], limit?: number): Promise<RAGKnowledgeItem[]>;
  getAllKnowledge(): Promise<RAGKnowledgeItem[]>;
  deleteKnowledge(id: string): Promise<boolean>;
  clearAll(): Promise<void>;
}

/**
 * Simple In-Memory RAG Storage Implementation
 */
class InMemoryRAGStorage implements RAGStorage {
  private static instance: InMemoryRAGStorage;
  private knowledge: Map<string, RAGKnowledgeItem> = new Map();

  static getInstance(): InMemoryRAGStorage {
    if (!InMemoryRAGStorage.instance) {
      InMemoryRAGStorage.instance = new InMemoryRAGStorage();
    }
    return InMemoryRAGStorage.instance;
  }

  async addKnowledge(item: RAGKnowledgeItem): Promise<void> {
    this.knowledge.set(item.id, item);
  }

  async searchSimilar(query: string, queryEmbedding: number[], limit = 5): Promise<RAGKnowledgeItem[]> {
    const items = Array.from(this.knowledge.values());
    
    // Calculate cosine similarity for each item
    const similarities = items
      .filter(item => item.embedding && item.embedding.length > 0)
      .map(item => ({
        item,
        similarity: this.cosineSimilarity(queryEmbedding, item.embedding!)
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return similarities.map(s => s.item);
  }

  async getAllKnowledge(): Promise<RAGKnowledgeItem[]> {
    return Array.from(this.knowledge.values());
  }

  async deleteKnowledge(id: string): Promise<boolean> {
    return this.knowledge.delete(id);
  }

  async clearAll(): Promise<void> {
    this.knowledge.clear();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

/**
 * Global RAG storage instance (singleton)
 */
const ragStorage = InMemoryRAGStorage.getInstance();

/**
 * RAG Tool Input Interface
 */
export interface RAGToolInput {
  action: "add" | "search" | "list" | "delete" | "clear" | "loadFile" | "loadBulk" | "export" | "saveToFile";
  content?: string;
  query?: string;
  metadata?: Record<string, any>;
  id?: string;
  limit?: number;
  filePath?: string;
  format?: "json" | "buffer";
  includeEmbeddings?: boolean;
  items?: Array<{
    content: string;
    metadata?: Record<string, any>;
    id?: string;
    embedding?: number[];
  }>;
  agentConfig?: {
    openaiKey?: string;
  };
}

/**
 * Core RAG functionality
 */
const ragTool = async (input: RAGToolInput): Promise<any> => {
  const { action, content, query, metadata = {}, id, limit = 5, filePath, items, agentConfig } = input;

  // Initialize embeddings if we have an OpenAI key
  let embeddings: OpenAIEmbeddings | null = null;
  if (agentConfig?.openaiKey) {
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: agentConfig.openaiKey,
      modelName: "text-embedding-ada-002"
    });
  }

  switch (action) {
    case "add":
      if (!content) {
        throw new Error("Content is required for adding knowledge");
      }
      
      const knowledgeId = id || `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Generate embedding if OpenAI key is available
      let embedding: number[] | undefined;
      if (embeddings) {
        try {
          const embeddingResult = await embeddings.embedQuery(content);
          embedding = embeddingResult;
        } catch (error) {
          console.warn("Failed to generate embedding:", error);
        }
      }

      const knowledgeItem: RAGKnowledgeItem = {
        id: knowledgeId,
        content,
        metadata,
        embedding,
        timestamp: Date.now()
      };

      await ragStorage.addKnowledge(knowledgeItem);
      
      return {
        success: true,
        message: `Knowledge added with ID: ${knowledgeId}`,
        id: knowledgeId,
        hasEmbedding: !!embedding
      };

    case "loadFile":
      if (!filePath) {
        throw new Error("File path is required for loading file");
      }

      try {
        const absolutePath = path.resolve(filePath);
        
        if (!fs.existsSync(absolutePath)) {
          throw new Error(`File not found: ${absolutePath}`);
        }

        const fileExtension = path.extname(absolutePath).toLowerCase();
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        
        let loadedItems: any[] = [];
        let loadCount = 0;
        
        if (fileExtension === '.json') {
          // Handle JSON files with various formats
          const jsonData = JSON.parse(fileContent);
          
          if (Array.isArray(jsonData)) {
            // Array of knowledge items
            loadedItems = jsonData;
          } else if (jsonData.knowledge && Array.isArray(jsonData.knowledge)) {
            // Object with knowledge array
            loadedItems = jsonData.knowledge;
          } else if (jsonData.content) {
            // Single knowledge item
            loadedItems = [jsonData];
          } else {
            // Treat entire JSON as single knowledge item
            loadedItems = [{
              content: JSON.stringify(jsonData, null, 2),
              metadata: { source: 'json_file', fileName: path.basename(absolutePath) }
            }];
          }
        } else if (fileExtension === '.pdf') {
          // For PDF files, add as single item (future: could integrate PDF parser)
          loadedItems = [{
            content: `PDF Document: ${path.basename(absolutePath)}\n\nNote: PDF content parsing not yet implemented. This is a placeholder for PDF document: ${absolutePath}`,
            metadata: { 
              source: 'pdf_file', 
              fileName: path.basename(absolutePath),
              filePath: absolutePath,
              fileType: 'pdf'
            }
          }];
        } else {
          // Handle other text files
          loadedItems = [{
            content: fileContent,
            metadata: { 
              source: 'text_file', 
              fileName: path.basename(absolutePath),
              fileType: fileExtension.substring(1) || 'txt'
            }
          }];
        }

        // Process each item
        for (const item of loadedItems) {
          if (!item.content) continue;
          
          const itemId = item.id || `file_${Date.now()}_${loadCount}_${Math.random().toString(36).substr(2, 6)}`;
          
          // Generate embedding if available and not already present
          let itemEmbedding = item.embedding;
          if (!itemEmbedding && embeddings) {
            try {
              itemEmbedding = await embeddings.embedQuery(item.content);
            } catch (error) {
              console.warn(`Failed to generate embedding for item ${itemId}:`, error);
            }
          }

          const knowledgeItem: RAGKnowledgeItem = {
            id: itemId,
            content: item.content,
            metadata: {
              ...item.metadata,
              loadedFromFile: absolutePath,
              loadedAt: Date.now()
            },
            embedding: itemEmbedding,
            timestamp: Date.now()
          };

          await ragStorage.addKnowledge(knowledgeItem);
          loadCount++;
        }

        return {
          success: true,
          message: `Loaded ${loadCount} knowledge items from ${path.basename(absolutePath)}`,
          loadCount,
          fileName: path.basename(absolutePath),
          fileType: fileExtension.substring(1) || 'unknown'
        };

      } catch (error) {
        throw new Error(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    case "loadBulk":
      if (!items || !Array.isArray(items)) {
        throw new Error("Items array is required for bulk loading");
      }

      let bulkLoadCount = 0;
      const bulkResults: any[] = [];

      for (const item of items) {
        if (!item.content) {
          bulkResults.push({ success: false, error: "Content is required" });
          continue;
        }

        try {
          const itemId = item.id || `bulk_${Date.now()}_${bulkLoadCount}_${Math.random().toString(36).substr(2, 6)}`;
          
          // Use provided embedding or generate new one
          let itemEmbedding = item.embedding;
          if (!itemEmbedding && embeddings) {
            try {
              itemEmbedding = await embeddings.embedQuery(item.content);
            } catch (error) {
              console.warn(`Failed to generate embedding for bulk item ${itemId}:`, error);
            }
          }

          const knowledgeItem: RAGKnowledgeItem = {
            id: itemId,
            content: item.content,
            metadata: {
              ...item.metadata,
              bulkLoaded: true,
              loadedAt: Date.now()
            },
            embedding: itemEmbedding,
            timestamp: Date.now()
          };

          await ragStorage.addKnowledge(knowledgeItem);
          bulkLoadCount++;
          bulkResults.push({ 
            success: true, 
            id: itemId, 
            hasEmbedding: !!itemEmbedding 
          });

        } catch (error) {
          bulkResults.push({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      return {
        success: true,
        message: `Bulk loaded ${bulkLoadCount} out of ${items.length} items`,
        loadCount: bulkLoadCount,
        totalItems: items.length,
        results: bulkResults
      };

    case "search":
      if (!query) {
        throw new Error("Query is required for searching knowledge");
      }

      // If we have embeddings, use semantic search
      if (embeddings) {
        try {
          const queryEmbedding = await embeddings.embedQuery(query);
          const results = await ragStorage.searchSimilar(query, queryEmbedding, limit);
          
          return {
            success: true,
            query,
            results: results.map(item => ({
              id: item.id,
              content: item.content,
              metadata: item.metadata,
              timestamp: item.timestamp
            })),
            searchType: "semantic"
          };
        } catch (error) {
          console.warn("Semantic search failed, falling back to text search:", error);
        }
      }

      // Fallback to simple text search
      const allKnowledge = await ragStorage.getAllKnowledge();
      
      // Split query into terms for better matching
      const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
      
      const textResults = allKnowledge
        .filter(item => {
          const content = item.content.toLowerCase();
          const metadataValues = Object.values(item.metadata).map(val => 
            typeof val === 'string' ? val.toLowerCase() : ''
          ).join(' ');
          
          // Check if any query term matches content or metadata
          return queryTerms.some(term => 
            content.includes(term) || metadataValues.includes(term)
          );
        })
        .sort((a, b) => b.timestamp - a.timestamp) // Sort by most recent first
        .slice(0, limit);

      return {
        success: true,
        query,
        results: textResults.map(item => ({
          id: item.id,
          content: item.content,
          metadata: item.metadata,
          timestamp: item.timestamp
        })),
        searchType: "text"
      };

    case "list":
      const allItems = await ragStorage.getAllKnowledge();
      return {
        success: true,
        knowledge: allItems.map(item => ({
          id: item.id,
          content: item.content.substring(0, 200) + (item.content.length > 200 ? "..." : ""),
          metadata: item.metadata,
          timestamp: item.timestamp,
          hasEmbedding: !!item.embedding
        })),
        total: allItems.length
      };

    case "delete":
      if (!id) {
        throw new Error("ID is required for deleting knowledge");
      }
      
      const deleted = await ragStorage.deleteKnowledge(id);
      return {
        success: deleted,
        message: deleted ? `Knowledge with ID ${id} deleted` : `Knowledge with ID ${id} not found`
      };

    case "clear":
      await ragStorage.clearAll();
      return {
        success: true,
        message: "All knowledge cleared"
      };

    case "export":
      const exportFormat = input.format || "json";
      const includeEmbeddings = input.includeEmbeddings !== false; // Default to true
      
      const allKnowledgeForExport = await ragStorage.getAllKnowledge();
      const exportData = {
        knowledge: allKnowledgeForExport.map(item => ({
          id: item.id,
          content: item.content,
          metadata: item.metadata,
          timestamp: item.timestamp,
          ...(includeEmbeddings && item.embedding && { embedding: item.embedding })
        })),
        metadata: {
          exportedAt: new Date().toISOString(),
          totalItems: allKnowledgeForExport.length,
          format: exportFormat,
          includesEmbeddings: includeEmbeddings
        }
      };

      if (exportFormat === "buffer") {
        // Convert to Buffer for binary storage
        const jsonString = JSON.stringify(exportData, null, 2);
        const buffer = Buffer.from(jsonString, 'utf8');
        
        return {
          success: true,
          message: `Exported ${allKnowledgeForExport.length} knowledge items to buffer`,
          format: "buffer",
          buffer: buffer,
          bufferSize: buffer.length,
          data: exportData // Also include JSON data for flexibility
        };
      } else {
        // Return as JSON object
        return {
          success: true,
          message: `Exported ${allKnowledgeForExport.length} knowledge items as JSON`,
          format: "json",
          data: exportData
        };
      }

    case "saveToFile":
      if (!filePath) {
        throw new Error("File path is required for saving to file");
      }

      const saveFormat = input.format || "json";
      const saveIncludeEmbeddings = input.includeEmbeddings !== false;
      
      try {
        const allKnowledgeForSave = await ragStorage.getAllKnowledge();
        const saveData = {
          knowledge: allKnowledgeForSave.map(item => ({
            id: item.id,
            content: item.content,
            metadata: item.metadata,
            timestamp: item.timestamp,
            ...(saveIncludeEmbeddings && item.embedding && { embedding: item.embedding })
          })),
          metadata: {
            savedAt: new Date().toISOString(),
            totalItems: allKnowledgeForSave.length,
            format: saveFormat,
            includesEmbeddings: saveIncludeEmbeddings
          }
        };

        const absoluteSavePath = path.resolve(filePath);
        
        if (saveFormat === "buffer") {
          // Save as binary buffer
          const jsonString = JSON.stringify(saveData, null, 2);
          const buffer = Buffer.from(jsonString, 'utf8');
          fs.writeFileSync(absoluteSavePath, buffer);
        } else {
          // Save as JSON file
          fs.writeFileSync(absoluteSavePath, JSON.stringify(saveData, null, 2), 'utf8');
        }

        return {
          success: true,
          message: `Saved ${allKnowledgeForSave.length} knowledge items to ${path.basename(absoluteSavePath)}`,
          filePath: absoluteSavePath,
          format: saveFormat,
          totalItems: allKnowledgeForSave.length,
          fileSize: fs.statSync(absoluteSavePath).size
        };

      } catch (error) {
        throw new Error(`Failed to save file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

/**
 * RAG Tool Definition for LangChain
 */
export const ragToolDef = tool(
  async (input: RAGToolInput): Promise<string> => {
    try {
      const result = await ragTool(input);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }, null, 2);
    }
  },
  {
    name: "rag-knowledge",
    description: `RAG (Retrieval-Augmented Generation) tool for managing and searching knowledge bases. 
    Supports adding documents, semantic search using embeddings, file loading, and knowledge management.
    Actions: 
    - 'add' (store knowledge), 
    - 'search' (find relevant knowledge), 
    - 'list' (view all), 
    - 'delete' (remove by ID), 
    - 'clear' (remove all),
    - 'loadFile' (load from JSON/PDF/text files),
    - 'loadBulk' (batch load multiple items with optional embeddings),
    - 'export' (export knowledge to JSON or buffer format),
    - 'saveToFile' (save knowledge to filesystem).
    Use this when you need to store information for later retrieval or search existing knowledge.`,
    schema: z.object({
      action: z.enum(["add", "search", "list", "delete", "clear", "loadFile", "loadBulk", "export", "saveToFile"]).describe("Action to perform"),
      content: z.string().optional().describe("Content to add (required for 'add' action)"),
      query: z.string().optional().describe("Search query (required for 'search' action)"),
      metadata: z.record(z.any()).optional().describe("Additional metadata for knowledge item"),
      id: z.string().optional().describe("Knowledge ID (required for 'delete' action)"),
      limit: z.number().optional().describe("Maximum number of search results (default: 5)"),
      filePath: z.string().optional().describe("Path to file to load/save (required for 'loadFile' and 'saveToFile' actions)"),
      format: z.enum(["json", "buffer"]).optional().describe("Export format (default: json)"),
      includeEmbeddings: z.boolean().optional().describe("Include embeddings in export (default: true)"),
      items: z.array(z.object({
        content: z.string(),
        metadata: z.record(z.any()).optional(),
        id: z.string().optional(),
        embedding: z.array(z.number()).optional()
      })).optional().describe("Array of items to bulk load (required for 'loadBulk' action)"),
      agentConfig: z.object({
        openaiKey: z.string().optional()
      }).optional()
    })
  }
);

/**
 * Export storage for external access (for web interface)
 */
export { ragStorage };