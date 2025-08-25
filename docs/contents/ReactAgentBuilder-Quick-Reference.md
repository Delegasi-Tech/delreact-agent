---
sidebar_position: 3
title: ReactAgent Builder
description: Quick reference for ReactAgent Builder API
---

# Quick Reference

## 1. Basic Workflow

```typescript
import { ReactAgentBuilder } from "delreact-agent";

// For provider = 'openrouter', set openaiKey to your OpenRouter API key
const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
});

const workflow = builder.init({
  selectedProvider: "gemini", // or 'openrouter' for OpenRouter
  model: "gemini-2.0-flash", // or your OpenRouter model name
}).build();

const result = await workflow.invoke({
  objective: "Your task here"
});

console.log(result.conclusion);
```

## 2. Runtime Config & Session

```typescript
const workflow = builder.init({
  selectedProvider: "openai",
  model: "gpt-4o-mini"
}).build();

const result = await workflow.invoke({
  objective: "Analyze something",
  sessionId: "my-session-001"
});
```

## 3. Custom Output Format

```typescript
const result = await workflow.invoke({
  objective: "Summarize this article",
  outputInstruction: "Return a bullet list."
});
```

## 3.1. Unified File Interface (Images + Documents) - NEW

```typescript
const result = await workflow.invoke({
  objective: "Analyze sales dashboard and underlying data",
  outputInstruction: "Provide comprehensive analysis with insights and recommendations",
  files: [
    {
      type: 'image',
      data: "/path/to/dashboard.png",
      detail: "high"
    },
    {
      type: 'document',
      data: "/path/to/sales-data.xlsx",
      options: { maxRows: 100, sheetName: 'Q3_Sales' }
    },
    {
      type: 'image', 
      data: "data:image/jpeg;base64,/9j/4AAQ...",
      detail: "auto"
    },
    {
      type: 'document',
      data: "/path/to/metrics.csv",
      options: { maxRows: 50 }
    }
  ]
});
```

## 4. Accessing State & Config

```typescript
console.log(workflow.config);        // Static config
console.log(workflow.runtimeConfig); // Runtime config
console.log(workflow.result);        // Last agent state/result
```

## 5. Direct LLM Call from Builder

You can call the LLM directly using the builder instance, with all config and tool context:

```typescript
const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
});

// Text-only call
const llmResult = await builder.callLLM("What is known brand of Jeans denim?", {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  // ...other options
});

// Multimodal call with files processed first
const { images } = await processFileInputs([
  { type: 'image', data: "/path/to/image.jpg", detail: "high" }
]);
const visionResult = await builder.callLLM("Describe what you see in this image", {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  images: images
});
console.log(visionResult);
```

## 5.1. Separate Model Configuration

```typescript
// Cost-optimized: Fast reasoning, quality execution
const workflow = builder.init({
  reasonProvider: "gemini",        // Fast for planning
  reasonModel: "gemini-2.0-flash",
  selectedProvider: "openai",     // Quality for outputs
  model: "gpt-4o-mini"
}).build();

// Same provider, different models
const workflow2 = builder.init({
  reasonProvider: "openai",
  reasonModel: "gpt-4o-mini",     // Fast reasoning
  selectedProvider: "openai", 
  model: "gpt-4o"                 // Quality execution
}).build();

// Backward compatible (unchanged)
const workflow3 = builder.init({
  selectedProvider: "gemini",
  model: "gemini-2.0-flash"       // All agents use this
}).build();
```

## 6. Error Handling

```typescript
try {
  const result = await workflow.invoke({ objective: "Do something" });
} catch (error) {
  console.error(error);
}
```

## 7. Batch Processing

```typescript
async function batch(workflow, objectives) {
  return Promise.all(objectives.map(obj => workflow.invoke({ objective: obj })));
}
```

## 9. Express API Example

```typescript
import express from 'express';
const app = express();
const workflow = new ReactAgentBuilder({ geminiKey: process.env.GEMINI_KEY }).init(...).build();

app.post('/api/agent', async (req, res) => {
  const result = await workflow.invoke(req.body);
  res.json(result);
});
```

## 10. Event System Quick Reference

### Listen to Agent Events

```typescript
const builder = new ReactAgentBuilder(config);
builder.on("taskBreakdown", (payload) => {
  console.log("Task breakdown event:", payload.data);
});
builder.on("agent:log", (payload) => {
  // Listen to all agent logs
  console.log(`[${payload.agent}] (${payload.operation}):`, payload.data);
});
```

### Available Events

- `taskBreakdown`: After task breakdown
- `taskReplan`: After task replanning
- `enhancingPrompt`: When prompt enhancement starts
- `finalEnhancement`: After prompt enhancement completes
- `evaluateState`: When replanning agent evaluates state
- `summarizeTaskDetected`: When summarize task is detected
- `addingSummarizeTask`: When summarize task is added
- `summaryCompleted`: After summary/conclusion is produced
- `agent:log`: All agent logs (catch-all)

### Payload Shape

```typescript
{
  agent: string,        // Name of the agent emitting the event
  operation: string,    // Operation or event type
  data: any,            // Event-specific data (e.g., tasks, results, state)
  sessionId?: string    // (Optional) Session identifier for tracking
}
```

## 11. Control Task Breakdown Granularity

You can control the maximum number of tasks generated during task breakdown by setting the `maxTasks` runtime config parameter. Default is 5

**A larger value for `maxTasks` means the agent will break down the objective into more, smaller steps—resulting in a more detailed and thorough plan.**

```typescript
const workflow = builder.init({
  maxTasks: 3, // Limit task breakdown to 3 tasks (plus summarize)
  selectedProvider: "gemini",
  model: "gemini-2.5-flash"
}).build();

const result = await workflow.invoke({
  objective: "Plan a product launch for a new SaaS tool"
});

console.log(result.fullState.tasks); // Will contain at most 3 tasks + summarize
```

---

**Tip:** Always use `.build()` to get the workflow object before calling `invoke`. Use `init()` for runtime overrides.
