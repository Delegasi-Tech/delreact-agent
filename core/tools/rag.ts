import { tool } from "@langchain/core/tools";
import { OpenAIEmbeddings } from "@langchain/openai";
import z from "zod";

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
  action: "add" | "search" | "list" | "delete" | "clear";
  content?: string;
  query?: string;
  metadata?: Record<string, any>;
  id?: string;
  limit?: number;
  agentConfig?: {
    openaiKey?: string;
  };
}

/**
 * Core RAG functionality
 */
const ragTool = async (input: RAGToolInput): Promise<any> => {
  const { action, content, query, metadata = {}, id, limit = 5, agentConfig } = input;

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
    Supports adding documents, semantic search using embeddings, and knowledge management.
    Actions: 'add' (store knowledge), 'search' (find relevant knowledge), 'list' (view all), 'delete' (remove by ID), 'clear' (remove all).
    Use this when you need to store information for later retrieval or search existing knowledge.`,
    schema: z.object({
      action: z.enum(["add", "search", "list", "delete", "clear"]).describe("Action to perform"),
      content: z.string().optional().describe("Content to add (required for 'add' action)"),
      query: z.string().optional().describe("Search query (required for 'search' action)"),
      metadata: z.record(z.any()).optional().describe("Additional metadata for knowledge item"),
      id: z.string().optional().describe("Knowledge ID (required for 'delete' action)"),
      limit: z.number().optional().describe("Maximum number of search results (default: 5)"),
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