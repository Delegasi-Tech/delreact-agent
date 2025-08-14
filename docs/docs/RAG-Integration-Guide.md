---
sidebar_position: 10
title: RAG Integration Guide
description: Retrieval-Augmented Generation integration guide
---

# RAG Integration Guide

## Overview

The RAG tool adds grounded retrieval over your local, vectorized knowledge base, so agents can cite exact passages from your docs, notes, PDFs, or KB articles instead of hallucinating. It is exposed as the `ragSearch` tool and is auto-registered when the agent is built, becoming available whenever RAG is properly configured.

This guide covers installation, configuration, vector file format, usage, performance tuning with ANN acceleration, and troubleshooting.

---

## Key Capabilities

- Retrieve semantically similar passages from local vector stores
- Ground answers with source and title metadata
- Configurable scoring threshold and topK
- Optional high-speed ANN search via `hnswlib-node` (falls back to exact search if unavailable)

---

## Installation

### 1) Base package

Install the framework (if you use it as a package):

```bash
npm i delreact-agent
```

Or if you are working directly in this repository, run:

```bash
npm install
```

### 2) Optional ANN acceleration (recommended)

`ragSearch` automatically uses `hnswlib-node` if it is installed to build an in-memory ANN index for faster queries. If not installed, it falls back to a safe, brute‑force cosine similarity search.

Install it to unlock ANN acceleration:

```bash
npm i hnswlib-node
```

Notes:
- Requires Node.js 18+.
- Prebuilt binaries are available for common platforms; otherwise a native build toolchain may be required (node-gyp and platform build tools).
- No additional configuration is needed in your code. The tool dynamically imports `hnswlib-node` and uses it if present.

### 3) OpenAI Embeddings

`ragSearch` uses OpenAI Embeddings to embed the query at runtime. Set your key:

```bash
export OPENAI_KEY=sk-...
```

Alternatively, pass it via the agent config `openaiKey`.

---

## Configuration

Add RAG configuration to your `ReactAgentBuilder` config. The tool is auto-registered and becomes available when both `openaiKey` and valid `rag` config are present.

```typescript
import { ReactAgentBuilder } from "delreact-agent";

const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY, // required for embeddings
  rag: {
    vectorFiles: [
      "./example/asset/attention-is-all-you-need.json",
      "./example/asset/color-palletes-in-marketing.json",
      "./example/asset/relation-traditional-marketing.json"
    ],
    embeddingModel: "text-embedding-3-small", // optional, defaults to this
    topK: 5,           // optional default for results
    threshold: 0.7     // optional similarity threshold (0..1)
  }
})
.init({
  selectedProvider: "gemini",
  model: "gemini-2.5-flash"
})
.build();

const result = await builder.invoke({
  objective: "What does the Transformer architecture propose and why was it impactful?"
});

console.log(result.conclusion);
```

RAG can also be triggered proactively by the agent when the objective suggests facts/definitions/summaries. The tool returns grounded snippets that include source and title.

### ReactAgentConfig shape

```typescript
interface ReactAgentConfig {
  geminiKey?: string;
  openaiKey?: string;         // required for ragSearch
  useEnhancedPrompt?: boolean;
  memory?: "in-memory" | "postgres" | "redis";
  enableToolSummary?: boolean;
  sessionId?: string;
  braveApiKey?: string;
  heliconeKey?: string;
  useSubgraph?: boolean;
  rag?: {
    vectorFiles: string[];    // absolute or relative paths to vector JSON files
    embeddingModel?: string;  // defaults to "text-embedding-3-small"
    topK?: number;            // default topK
    threshold?: number;       // default similarity threshold
  };
  mcp?: any;
}
```

---

## Vector File Format

Each vector file is a JSON database with an optional `metadata` section and a `vectors` array. Example:

```json
{
  "metadata": {
    "embeddingModel": "text-embedding-3-small"
  },
  "vectors": [
    {
      "id": "chunk-001",
      "text": "The Transformer architecture relies entirely on attention mechanisms...",
      "embedding": [0.0123, -0.0456, ...],
      "metadata": {
        "source": "./docs/attention-paper.pdf",
        "title": "Attention Is All You Need"
      }
    },
    {
      "id": "chunk-002",
      "text": "Self-attention allows the model to weigh different positions...",
      "embedding": [0.0345, 0.0121, ...],
      "metadata": {
        "source": "./docs/attention-paper.pdf",
        "title": "Attention Is All You Need"
      }
    }
  ]
}
```

Requirements:
- `vectors` must be an array of objects with `id`, `text`, `embedding: number[]`, and `metadata` (containing at least `source` and `title`).
- Embeddings will be normalized internally for accurate cosine similarity.
- If `metadata.embeddingModel` is present, it is propagated into the aggregated index metadata.

Multiple files may be provided; they are merged internally into a single aggregated index.

---

## Usage Patterns

### 1) Agent-driven usage (recommended)

The agent automatically selects and runs `ragSearch` when the objective likely needs facts/definitions or summaries from your knowledge base.

```typescript
const result = await builder.invoke({
  objective: "Summarize the key claims from 'Attention Is All You Need' and cite the source."
});
console.log(result.conclusion);
```

Returned tool results include passage text, a similarity score, and metadata with `source` and `title`. The agent synthesizes these into a grounded answer.

### 2) Forcing `ragSearch` (advanced)

If you want to explicitly call the tool yourself, you can access it via the tool registry. The framework auto-registers `ragSearch` with availability gating based on your config.

```typescript
import { toolRegistry } from "delreact-agent/core/tools";

const tools = toolRegistry.createToolsWithConfig(builder.config);
const rag = tools.find(t => t.name === "ragSearch");

if (rag) {
  const output = await rag.invoke({
    query: "What is the role of self-attention in Transformers?"
  });
  console.log(output);
}
```

---

## Performance Tuning

`ragSearch` uses two strategies:

- ANN acceleration with `hnswlib-node` when installed
  - Builds a cosine-space HNSW index once per unique combination of `vectorFiles`
  - Reuses cached indexes in-process for subsequent queries
  - Query-time `ef` is set to 100 for improved recall

- Brute-force cosine similarity fallback if ANN is not available
  - Robust and correct, but slower for large corpora

Recommendations:
- Install `hnswlib-node` for noticeable speedups on medium/large corpora.
- Keep vectors dimension-consistent across files when possible.
- Use sensible `threshold` values (e.g., 0.6–0.8) to reduce noise.
- Tune `topK` based on how many grounded citations you want.

---

## Tool API

Tool name: `ragSearch`

Input schema:

```ts
{
  query: string;          // The user's question
  topK?: number;          // Optional override of default topK
  threshold?: number;     // Optional override of default threshold
  agentConfig?: object;   // Injected automatically when used by the agent
}
```

Output: A formatted string with ranked results, including source/title, or an error message. When used indirectly by the agent, the agent will consume raw results to produce a grounded answer.

---

## Troubleshooting

- "Error: RAG search is not configured. No vector files provided (rag.vectorFiles)."
  - Provide at least one `vectorFiles` path in `config.rag`.

- "Error: OpenAI API key is not configured for RAG search."
  - Set `openaiKey` in the agent config or `OPENAI_KEY` in your environment.

- "OpenAI API Error: ..."
  - Check your API key, model name, and rate limits.

- Poor matches or irrelevant results
  - Lower the `threshold` or use a better embedding model.
  - Ensure the vector file embeddings are produced by a compatible model.

- ANN not being used
  - Make sure `hnswlib-node` is installed. The tool prints no errors if it falls back to brute-force; this is expected behavior when the package is missing.

---

## FAQ

### Do I have to use OpenAI Embeddings?
Yes, at present `ragSearch` embeds the query with OpenAI. Your stored vectors can come from any source, but better results are achieved when vectorized with the same or similar model.

### Can I mix multiple vector files?
Yes. Provide multiple paths in `vectorFiles`. They will be aggregated and searched as one corpus.

### Are relative paths supported?
Yes. Relative or absolute paths are supported. Internally, paths are resolved and cached.

---

## Example End-to-End

```typescript
import { ReactAgentBuilder } from "delreact-agent";

const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  rag: {
    vectorFiles: [
      "./example/asset/attention-is-all-you-need.json",
      "./example/asset/color-palletes-in-marketing.json",
      "./example/asset/relation-traditional-marketing.json"
    ],
    embeddingModel: "text-embedding-3-small",
    topK: 6,
    threshold: 0.68
  }
})
.init({ selectedProvider: "gemini", model: "gemini-2.5-flash" })
.build();

const res = await builder.invoke({
  objective: "Summarize the core ideas of the Transformer paper with 3 citations."
});

console.log(res.conclusion);
```

You're ready to build grounded agents with fast local retrieval.

