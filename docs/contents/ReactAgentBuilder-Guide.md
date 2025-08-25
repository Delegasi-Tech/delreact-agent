---
sidebar_position: 2
title: ReactAgent Builder Guide
description: Complete guide to building reactive agents with DelReact
---

# User Guide

## Overview

`ReactAgentBuilder` is the main class for the DelReact Agent framework. It manages the agent workflow, configuration, and execution pipeline using a state-driven approach.

## Basic Usage

### 1. Simple Setup

```typescript
import { ReactAgentBuilder } from "delreact-agent";

// Initialize with API keys
const agent = new ReactAgentBuilder({
  geminiKey: "your-gemini-api-key",
  openaiKey: "your-openai-api-key",  // Optional
});


# ReactAgentBuilder - User Guide

## Overview

`ReactAgentBuilder` is the main builder for the DelReact Agent framework. It manages agent workflow, configuration, and execution using a state-driven approach. The new API uses a builder pattern and returns a workflow object for execution.

## Basic Usage

### 1. Builder Pattern & Workflow Object

```typescript
import { ReactAgentBuilder } from "./src/core/index";

// For provider = 'openrouter', set openaiKey to your OpenRouter API key
const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  openrouterKey: process.env.OPENROUTER_KEY, // Use dedicated OpenRouter key
});

const workflow = builder.init({
  selectedProvider: "gemini", // or 'openrouter' for OpenRouter
  model: "gemini-2.0-flash", // or your OpenRouter model name
}).build();

const result = await workflow.invoke({
  objective: "Plan a marketing campaign for a new product launch"
});

console.log("Result:", result.conclusion);
console.log("Session ID:", result.sessionId);
console.log("Full State:", result.fullState);
console.log("Workflow config:", workflow.config);
console.log("Runtime config:", workflow.runtimeConfig);
console.log("Last result:", workflow.result);
```

### 2. With Custom Output Format

```typescript
const result = await workflow.invoke({
  objective: "Analyze competitor pricing strategies",
  outputInstruction: "Provide a table of strengths and weaknesses."
});
```

### 3. With Session Management

```typescript
const result = await workflow.invoke({
  objective: "Research renewable energy trends",
  sessionId: "research-session-001"
});

// Use the same session for follow-up requests
const followUp = await workflow.invoke({
  objective: "Create presentation based on renewable energy research",
  sessionId: result.sessionId
});
```

## Configuration Options

### Constructor Parameters

```typescript
interface ReactAgentConfig {
  geminiKey?: string;
  openaiKey?: string;
  openrouterKey?: string;
  useEnhancedPrompt?: boolean;
  memory?: "in-memory" | "postgres" | "redis";
  enableToolSummary?: boolean;
  sessionId?: string;
  braveApiKey?: string;
  heliconeKey?: string;
}
```

**Requirements:**
- At least one API key must be provided
- If both keys are provided and no provider is selected, defaults to "gemini"
- Use `openrouterKey` for OpenRouter provider (not `openaiKey`)
- Each provider now has its own dedicated key for clear separation

### Runtime Configuration (init)

```typescript
builder.init({
  selectedProvider: "openai",
  model: "gpt-4-turbo",
  // ...other runtime options
});
```


### Workflow Object Properties

- `invoke(request: AgentRequest, config?: any): Promise<AgentResponse>`
- `config`: The static config used to build the agent
- `runtimeConfig`: The runtime config passed via `init`
- `result`: The latest agent state/result after an invoke

### Direct LLM Call from Builder

You can call the LLM directly from a `ReactAgentBuilder` instance, using the same configuration and tool context as the workflow:

```typescript
const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
});

const llmResult = await builder.callLLM("What is known brand of Jeans denim?", {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  // ...other options
});
console.log(llmResult);
```

This is useful for one-off completions, tool-augmented LLM calls, or when you want to bypass the full agent workflow but still leverage the builder's config, provider abstraction, and tool registry.

### Request Parameters

```typescript
interface AgentRequest {
  objective: string;
  prompt?: string;
  outputInstruction?: string;
  sessionId?: string;
  files?: FileInput[];
}

interface FileInput {
  type: 'image' | 'document';
  data: string | Buffer;
  mimeType?: string;
  detail?: 'auto' | 'low' | 'high';     // Images only
  options?: DocumentOptions;            // Documents only
}

interface DocumentOptions {
  maxRows?: number;
  includeHeaders?: boolean;
  sheetName?: string; // For Excel files
}
```

#### Unified File Support

DelReact supports multimodal input through the unified `files` parameter. You can pass both images and documents with proper type discrimination:

- **File paths**: `"/path/to/image.jpg"`
- **Base64 data URLs**: `"data:image/jpeg;base64,/9j/4AAQ..."`
- **Raw base64 strings**: `"/9j/4AAQSkZJRgABAQEASABIAAD..."`
- **Buffers**: `Buffer.from(imageData)`

**Example with unified files:**
```typescript
const result = await workflow.invoke({
  objective: "Analyze dashboard and underlying data for business insights",
  outputInstruction: "Provide comprehensive analysis of visual and structured data",
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
    }
  ]
});
```

### Response Structure

```typescript
interface AgentResponse {
  conclusion: string;
  sessionId: string;
  fullState: AgentState;
  error?: string;
}
```

## Advanced Configuration

### 1. Update Configuration After Initialization

```typescript
builder.updateConfig({
  openrouterKey: "new-openrouter-key",
  selectedProvider: "openrouter"
});
```

### 2. Provider Switching

```typescript
// Use Gemini
builder.init({ selectedProvider: "gemini" });
const geminiResult = await workflow.invoke({ objective: "Task 1" });

// Use OpenAI
builder.init({ selectedProvider: "openai" });
const openaiResult = await workflow.invoke({ objective: "Task 2" });

// Use OpenRouter
builder.init({ selectedProvider: "openrouter" });
const openrouterResult = await workflow.invoke({ objective: "Task 3" });
```

### 3. Separate Model Configuration

DelReact supports different models for reasoning and execution agents, enabling cost optimization and performance tuning:

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
```

**Agent Types:**
- **Reasoning Agents** (use `reasonProvider`/`reasonModel`): TaskBreakdown, TaskReplanning, EnhancePrompt
- **Execution Agents** (use `selectedProvider`/`model`): Action, Completion

**Backward Compatibility:** Existing single-model configurations continue to work unchanged.

## Real-World Examples

### 1. Content Creation Workflow

```typescript
const workflow = new ReactAgentBuilder({
  openaiKey: process.env.OPENAI_KEY,
  selectedProvider: "openai"
}).init(...).build();

const blogPost = await workflow.invoke({
  objective: "Create a comprehensive blog post about sustainable living practices",
});

console.log("Blog Post:", blogPost.conclusion);
```

### 2. Business Analysis Pipeline

```typescript
const workflow = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY
}).init(...).build();

const marketAnalysis = await workflow.invoke({
  objective: `Analyze the electric vehicle market in North America for Q1 2024`,
  sessionId: "market-analysis-ev-q1-2024"
});

const competitorDeepDive = await workflow.invoke({
  objective: "Deep dive analysis of Tesla's competitive positioning based on the previous market analysis",
  sessionId: marketAnalysis.sessionId
});
```

### 3. Technical Documentation Generator

```typescript
const workflow = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  selectedProvider: "gemini"
}).init(...).build();

const apiDocs = await workflow.invoke({
  objective: "Create comprehensive API documentation for a REST API with user authentication, CRUD operations, and file upload endpoints",
});

import fs from 'fs';
fs.writeFileSync('api-documentation.md', apiDocs.conclusion);
```

### 4. Research and Data Analysis

```typescript
const workflow = new ReactAgentBuilder({
  openaiKey: process.env.OPENAI_KEY,
  selectedProvider: "openai"
}).init(...).build();

const researchReport = await workflow.invoke({
  objective: `Research and analyze the impact of remote work on employee productivity and company culture in tech companies, focusing on studies from 2022-2024`,
});

console.log("Research completed:", researchReport.sessionId);
console.log("Report length:", researchReport.conclusion.length);
```

## Error Handling

### 1. Basic Error Handling

```typescript
try {
  const result = await workflow.invoke({ objective: "Some task" });
} catch (error) {
  console.error("Request failed:", error.message);
}
```

### 2. Robust Error Handling with Retry Logic

```typescript
async function executeWithRetry(workflow, request, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await workflow.invoke(request);
    } catch (error) {
      if (attempt === maxRetries) throw error;
    }
  }
}

const result = await executeWithRetry(workflow, {
  objective: "Critical task that must succeed"
});
```

## Performance Optimization

### 1. Reuse Workflow Instances

```typescript
const workflow = new ReactAgentBuilder({ geminiKey: "key" }).build();

const results = await Promise.all([
  workflow.invoke({ objective: "Task 1" }),
  workflow.invoke({ objective: "Task 2" })
]);
```

### 2. Batch Processing

```typescript
async function processBatch(workflow, objectives) {
  const results = [];
  for (const objective of objectives) {
    results.push(await workflow.invoke({ objective }));
  }
  return results;
}

const objectives = [
  "Analyze market trends for Q1",
  "Evaluate customer feedback patterns"
];

const batchResults = await processBatch(workflow, objectives);
console.log(`Processed ${batchResults.length} tasks`);
```

## Integration Patterns

### 1. Express.js API Server

```typescript
import express from 'express';
import { ReactAgentBuilder } from "delreact-agent";

const app = express();
app.use(express.json());

const workflow = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY
}).build();

app.post('/api/agent/execute', async (req, res) => {
  try {
    const result = await workflow.invoke(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Agent API server running on port 3000');
});
```

### 2. Queue-Based Processing

```typescript
import { Queue } from 'bull';
import { ReactAgentBuilder } from "delreact-agent";

const agentQueue = new Queue('agent processing');
const workflow = new ReactAgentBuilder({ geminiKey: process.env.GEMINI_KEY }).build();

agentQueue.process(async (job) => {
  const { objective, outputInstruction, userId } = job.data;
  return await workflow.invoke({ objective, outputInstruction });
});

export function queueAgentTask(objective, userId, outputInstruction) {
  return agentQueue.add('process', { objective, outputInstruction, userId });
}
```

## Monitoring and Observability

### 1. Built-in Session Tracking

```typescript
const result = await workflow.invoke({
  objective: "Track this execution",
  sessionId: "custom-tracking-id"
});

console.log("Track execution with ID:", result.sessionId);
```

### 2. Error Handling with Retry Logic

```typescript
async function executeWithRetry(agent, input, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await agent.invoke(input);
      if (!result.error) {
        return result;
      }
      
      console.warn(`Attempt ${attempt} failed: ${result.error}`);
      
      if (attempt === maxRetries) {
        throw new Error(`Max retries reached. Last error: ${result.error}`);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} threw error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Usage
const result = await executeWithRetry(agent, {
  objective: "Critical task that must succeed"
});
```

## Event System & Observability

ReactAgentBuilder supports a robust event-driven system for real-time observability and workflow integration. You can subscribe to key agent lifecycle events to monitor progress, log details, or trigger custom logic.

### Available Events

| Event Name              | Description                                                        |
|------------------------|--------------------------------------------------------------------|
| `taskBreakdown`        | Emitted after the TaskBreakdownAgent generates the task list.       |
| `taskReplan`           | Emitted after the TaskReplanningAgent replans the task list.        |
| `enhancingPrompt`      | Emitted when EnhancePromptAgent starts prompt enhancement.          |
| `finalEnhancement`     | Emitted after EnhancePromptAgent produces the final enhancement.    |
| `evaluateState`        | Emitted when TaskReplanningAgent evaluates the current state.       |
| `summarizeTaskDetected`| Emitted when a summarize task is detected in replanning.            |
| `addingSummarizeTask`  | Emitted when a summarize task is added due to objective completion. |
| `summaryCompleted`     | Emitted after CompletionAgent produces the final summary.           |
| `agent:log`            | Emitted for every logExecution call (all agent logs).              |

> **Note:** The `operation` field in the payload matches the event name for most events. `agent:log` is a catch-all for all logExecution calls.

### How to Listen to Events

Subscribe to events using `.on(eventName, handler)` on your ReactAgentBuilder instance:

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

To unsubscribe, use `.off(eventName, handler)`.

### Payload Structure

All event payloads have the following shape:

```typescript
{
  agent: string,        // Name of the agent emitting the event
  operation: string,    // Operation or event type
  data: any,            // Event-specific data (e.g., tasks, results, state)
  sessionId?: string    // (Optional) Session identifier for tracking
}
```

### Use Cases
- **Progress Tracking:** Update UI or logs as each agent completes a step.
- **Custom Analytics:** Collect metrics on agent workflow, task breakdowns, or completions.
- **Debugging:** Listen to `agent:log` for all internal logs and state transitions.
- **Notifications:** Trigger notifications or side effects when certain events occur (e.g., summary completed).

> For a full list of events and their payloads, see the agent source code or subscribe to `agent:log` to observe all emitted events in real time.

This comprehensive guide covers all aspects of using ReactAgentBuilder effectively, from basic usage to advanced integration patterns and monitoring strategies.