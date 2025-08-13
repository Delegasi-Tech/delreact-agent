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

export interface RAGSearchConfig {
  vectorFiles: string[];
  embeddingModel: string;
  topK: number;
  threshold: number;
}

// Caches and helpers
const fileDbCache = new Map<string, VectorDatabase>(); // per absolute file
const comboDbCache = new Map<string, VectorDatabase>(); // per sorted absolute paths combo
const annIndexCache = new Map<string, any>(); // ANN index per combo

const toAbs = (p: string) => resolve(p);
const getComboKey = (paths: string[]) => paths.map(toAbs).sort().join('|');

function normalizeEmbedding(embedding: number[]): number[] {
  let norm = 0;
  for (let i = 0; i < embedding.length; i++) norm += embedding[i] * embedding[i];
  norm = Math.sqrt(norm);
  if (!norm || !Number.isFinite(norm)) return embedding;
  const out = new Array(embedding.length);
  for (let i = 0; i < embedding.length; i++) out[i] = embedding[i] / norm;
  return out as number[];
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
  private annIndex: any | null = null;
  private annBuilt = false;
  private labelToIndex = new Map<number, number>();
  private comboKey: string;

  constructor(vectorFiles: string[]) {
    this.comboKey = getComboKey(vectorFiles);
    this.database = this.loadVectorDatabases(vectorFiles);
  }

  private loadSingleVectorDatabase(filePath: string): VectorDatabase {
    try {
      const resolvedPath = resolve(filePath);
      if (fileDbCache.has(resolvedPath)) {
        return fileDbCache.get(resolvedPath) as VectorDatabase;
      }
      const fileContent = readFileSync(resolvedPath, 'utf-8');
      const data = JSON.parse(fileContent);
      if (!data.vectors || !Array.isArray(data.vectors)) {
        throw new Error('Invalid vector file format: missing vectors array');
      }

      const db = data as VectorDatabase;
      // Normalize embeddings once
      db.vectors = db.vectors.map(v => ({
        ...v,
        embedding: normalizeEmbedding(v.embedding),
      }));
      fileDbCache.set(resolvedPath, db);
      return db;

    } catch (error: any) {
      throw new Error(`Failed to load vector database from ${filePath}: ${error.message}`);
    }
  }

  private loadVectorDatabases(filePaths: string[]): VectorDatabase {
    if (!filePaths || filePaths.length === 0) {
      throw new Error('No vector files provided');
    }
    const absPaths = filePaths.map(p => resolve(p));
    const key = getComboKey(absPaths);
    const cached = comboDbCache.get(key);
    if (cached) return cached;

    const aggregated: VectorDatabase = { metadata: { totalVectors: 0 }, vectors: [] };
    for (const absPath of absPaths) {
      const db = this.loadSingleVectorDatabase(absPath);
      for (const vector of db.vectors) {
        aggregated.vectors.push({
          ...vector,
          metadata: {
            ...vector.metadata,
            source: vector.metadata?.source || absPath,
          },
        });
      }
      aggregated.metadata = {
        ...(aggregated.metadata || {}),
        embeddingModel: db.metadata?.embeddingModel || aggregated.metadata?.embeddingModel,
        totalVectors: (aggregated.metadata?.totalVectors || 0) + (db.vectors?.length || 0),
      };
    }
    comboDbCache.set(key, aggregated);
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
  ): Promise<{ id: string; text: string; score: number; metadata: Vector['metadata']; }[] | []> {
    try {
      const queryEmbeddingRaw = await this.createQueryEmbedding(query, embeddingModel, apiKey);
      const queryEmbedding = normalizeEmbedding(queryEmbeddingRaw);

      // Use ANN if available; fallback to brute-force
      const annResults = await this.searchWithANN(queryEmbedding, topK).catch(() => null);
      let scores: { id: string; text: string; score: number; metadata: Vector['metadata'] }[];
      if (annResults && annResults.length > 0) {
        scores = annResults.map(({ index, distance }: { index: number; distance: number }) => {
          const vec = this.database.vectors[index];
          const score = 1 - distance; // cosine distance -> similarity
          return { ...vec, score };
        });
      } else {
        scores = this.database.vectors.map(vector => ({
          ...vector,
          score: cosineSimilarity(queryEmbedding, vector.embedding)
        }));
      }

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
    } catch (error) {
      console.error("RAG search failed:", error);
      return [];
    }
  }

  private async searchWithANN(queryEmbedding: number[], topK: number): Promise<{ index: number; distance: number }[] | null> {
    try {
      const hnsw = await import('hnswlib-node').catch(() => null) as any;
      if (!hnsw) return null;

      if (!this.annBuilt) {
        const dim = (this.database.vectors[0]?.embedding?.length) || 0;
        if (dim <= 0) return null;
        const numElements = this.database.vectors.length;
        const space = 'cosine';
        const M = 16;
        const efConstruction = 200;

        const existing = annIndexCache.get(this.comboKey);
        const IndexClass = (hnsw as any).HierarchicalNSW || (hnsw as any).default?.HierarchicalNSW || (hnsw as any);
        const index = existing || new IndexClass(space, dim);
        if (!existing) {
        index.initIndex(numElements, M, efConstruction);
        for (let i = 0; i < numElements; i++) {
          const emb = this.database.vectors[i].embedding;
          index.addPoint(emb, i);
          this.labelToIndex.set(i, i);
        }
        }

        // Increase efSearch for better recall at query time
        index.setEf(100);

        this.annIndex = index;
        this.annBuilt = true;
        annIndexCache.set(this.comboKey, index);
      }

      if (!this.annIndex) return null;
      const { neighbors, distances } = this.annIndex.searchKnn(queryEmbedding, topK);
      const results: { index: number; distance: number }[] = [];
      for (let i = 0; i < neighbors.length; i++) {
        const idx = this.labelToIndex.get(neighbors[i]);
        if (idx !== undefined) {
          results.push({ index: idx, distance: distances[i] });
        }
      }
      return results;
    } catch (error) {
      console.error("RAG search with ANN failed:", error);
      throw error;
    }
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
    const ragConfig = agentConfig.rag as RAGSearchConfig;
    const configuredVectorFiles: string[]  = ragConfig?.vectorFiles ?? []

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

      if (agentConfig?.debug) {
        console.log(`RAG results : `, formattedResults);
      }

      return `Found ${results.length} relevant results for "${query}":\n\n${formattedResults}`;
    } catch (error) {
      console.error("RAG search failed:", error);
      return `Error during RAG search: ${error instanceof Error ? error.message : JSON.stringify(error)}`;
    }
  },
});