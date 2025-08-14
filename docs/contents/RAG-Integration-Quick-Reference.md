---
sidebar_position: 11
title: RAG Integration
description: Quick reference for RAG integration
---

# Quick Reference

Minimal steps to enable the `ragSearch` tool for grounded retrieval.

---

## 1) Install

```bash
# Framework (if used as a package)
npm i delreact-agent

# Optional: ANN acceleration (recommended)
npm i hnswlib-node
```

Set your key for embeddings:

```bash
export OPENAI_KEY=sk-...
```

---

## 2) Configure

```typescript
import { ReactAgentBuilder } from "delreact-agent";

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  rag: {
    vectorFiles: [
      "./example/asset/attention-is-all-you-need.json",
      "./example/asset/color-palletes-in-marketing.json"
    ],
    embeddingModel: "text-embedding-3-small",
    topK: 5,
    threshold: 0.7
  }
})
.init({ selectedProvider: "gemini", model: "gemini-2.5-flash" })
.build();
```

`ragSearch` is auto-registered and available when `openaiKey` and `rag.vectorFiles` are provided.

---

## 3) Use

Agent-driven (recommended):

```typescript
const result = await agent.invoke({
  objective: "Summarize core ideas from 'Attention Is All You Need' with citations"
});
console.log(result.conclusion);
```

Force a direct tool call (advanced):

```typescript
import { toolRegistry } from "delreact-agent/core/tools";

const tools = toolRegistry.createToolsWithConfig(agent.config);
const rag = tools.find(t => t.name === "ragSearch");
const output = rag ? await rag.invoke({ query: "Role of self-attention?" }) : null;
```

---

## Tips

- Install `hnswlib-node` for faster search on larger corpora.
- Tune `threshold` (e.g., 0.6–0.8) to filter low-relevance hits.
- Provide multiple `vectorFiles` to aggregate sources.

