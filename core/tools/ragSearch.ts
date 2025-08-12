import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createAgentTool } from "../toolkit";

interface Vector {
  id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    title: string;
    [key: string]: any;
  };
}

interface VectorDatabase {
  metadata?: {
    createdAt?: string;
    totalVectors?: number;
    embeddingModel?: string;
    [key: string]: any;
  };
  vectors: Vector[];
}

/**
 * Compute cosine similarity between two numeric vectors.
 * - Uses the overlapping length if dimensions differ
 * - Returns 0 when a norm is 0 or vectors are empty
 * - Clamps output to [-1, 1]
 */
function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (!Array.isArray(vectorA) || !Array.isArray(vectorB)) {
    return 0;
  }

  const length = Math.min(vectorA.length, vectorB.length);
  if (length === 0) return 0;

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < length; i++) {
    const a = vectorA[i] ?? 0;
    const b = vectorB[i] ?? 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  const score = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  // Clamp for numerical stability
  if (Number.isNaN(score) || !Number.isFinite(score)) return 0;
  return Math.max(-1, Math.min(1, score));
}

/**
 * Encapsulates the logic for performing RAG search.
 * This class manages loading the vector database and creating embeddings.
 */
class RAGSearch {
  private database: VectorDatabase;

  constructor(vectorFiles: string[]) {
    this.database = this.loadVectorDatabases(vectorFiles);
  }

  private loadSingleVectorDatabase(filePath: string): VectorDatabase {
    try {
      const resolvedPath = resolve(filePath);
      const fileContent = readFileSync(resolvedPath, 'utf-8');
      const data = JSON.parse(fileContent);
      if (!data.vectors || !Array.isArray(data.vectors)) {
        throw new Error('Invalid vector file format: missing vectors array');
      }
      return data as VectorDatabase;
    } catch (error: any) {
      throw new Error(`Failed to load vector database from ${filePath}: ${error.message}`);
    }
  }

  private loadVectorDatabases(filePaths: string[]): VectorDatabase {
    if (!filePaths || filePaths.length === 0) {
      throw new Error('No vector files provided');
    }

    const aggregated: VectorDatabase = { metadata: { totalVectors: 0 }, vectors: [] };

    for (const filePath of filePaths) {
      const db = this.loadSingleVectorDatabase(filePath);
      // Merge vectors, preserving metadata and source
      for (const vector of db.vectors) {
        aggregated.vectors.push({
          ...vector,
          metadata: {
            ...vector.metadata,
            source: vector.metadata?.source || filePath,
          },
        });
      }
      aggregated.metadata = {
        ...(aggregated.metadata || {}),
        embeddingModel: db.metadata?.embeddingModel || aggregated.metadata?.embeddingModel,
        totalVectors: (aggregated.metadata?.totalVectors || 0) + (db.vectors?.length || 0),
      };
    }

    return aggregated;
  }

  private async createQueryEmbedding(query: string, model: string, apiKey: string): Promise<number[]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query.slice(0, 8191), // OpenAI input limit
        model: model,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  public async search(
    query: string,
    apiKey: string,
    embeddingModel: string,
    topK: number,
    threshold: number
  ): Promise<any[]> {
    const queryEmbedding = await this.createQueryEmbedding(query, embeddingModel, apiKey);

    const scores = this.database.vectors.map(vector => ({
      ...vector,
      score: cosineSimilarity(queryEmbedding, vector.embedding)
    }));

    return scores
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(result => ({
        id: result.id,
        text: result.text,
        score: result.score,
        metadata: result.metadata
      }));
  }
}

export const ragSearchToolDef = createAgentTool({
  name: "ragSearch",
  description: "Grounded retrieval over a local vectorized corpus of documents (e.g., PDFs, notes, FAQs, specs, policies, KB articles). Use this tool proactively BEFORE answering when the objective likely relies on content from these local documents: factual questions, definitions, procedures, metrics/tables, or requests to summarize/synthesize across docs. Prefer this over free-form reasoning to avoid hallucinations. If relevant passages are found, ground the answer and cite metadata (source/title). If nothing relevant is found, state that, then proceed with best-effort reasoning.",
  schema: {
    query: { type: "string", description: "The user's question, phrased clearly for the best semantic matching." },
    topK: { type: "number", description: "Overrides the default number of results to return.", optional: true },
    threshold: { type: "number", description: "Overrides the default similarity score threshold (0-1).", optional: true },
    agentConfig: { type: "object", description: "Agent configuration (automatically provided)", optional: true }
  },
  async run({ query, agentConfig }) {
    const ragConfig = agentConfig.rag;
    const configuredVectorFiles: string[] | undefined = (ragConfig?.vectorFiles && ragConfig.vectorFiles.length > 0)
      ? ragConfig.vectorFiles
      // Backward compatibility: allow single vectorFile string
      : (ragConfig?.vectorFile ? [ragConfig.vectorFile] : undefined);

    if (!configuredVectorFiles || configuredVectorFiles.length === 0) {
      return "Error: RAG search is not configured. No vector files provided (rag.vectorFiles).";
    }
    const openaiKey = agentConfig.openaiKey;
    if (!openaiKey) {
      return "Error: OpenAI API key is not configured for RAG search.";
    }

    try {
      const searcher = new RAGSearch(configuredVectorFiles);

      const results = await searcher.search(
        query,
        openaiKey,
        ragConfig?.embeddingModel || "text-embedding-3-small",
        ragConfig?.topK ?? 5,
        ragConfig?.threshold ?? 0.7
      );

      if (results.length === 0) {
        return `No relevant results found for query "${query}".`;
      }

      const formattedResults = results.map((result, index) =>
        `Result ${index + 1} (Score: ${result.score.toFixed(3)}):\nSource: ${result.metadata.source}\nTitle: ${result.metadata.title}\nContent: ${result.text}`
      ).join('\n\n---\n\n');

      return `Found ${results.length} relevant results for "${query}":\n\n${formattedResults}`;
    } catch (error: any) {
      console.error("RAG search failed:", error);
      return `Error during RAG search: ${error.message}`;
    }
  },
});