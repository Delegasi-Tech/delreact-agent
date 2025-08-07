# ReactAgentBuilder Quick Reference

## 1. Basic Workflow

```typescript
import { ReactAgentBuilder } from "./src/core/index";

const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
});

const workflow = builder.init({
  selectedProvider: "gemini",
  model: "gemini-2.0-flash",
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

const llmResult = await builder.callLLM("What is known brand of Jeans denim?", {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  // ...other options
});
console.log(llmResult);
```

## 6. Replace Action Node (Advanced)

```typescript
import { CustomAgent } from "./core/example/specializedAgents";
const workflow = new ReactAgentBuilder({ geminiKey })
  .replaceActionNode(CustomAgent)
  .build();
```

## 7. Error Handling

```typescript
try {
  const result = await workflow.invoke({ objective: "Do something" });
} catch (error) {
  console.error(error);
}
```

## 8. Batch Processing

```typescript
async function batch(workflow, objectives) {
  return Promise.all(objectives.map(obj => workflow.invoke({ objective: obj })));
}
```

## 9. Express API Example

```typescript
import express from 'express';
const app = express();
const workflow = new ReactAgentBuilder({ geminiKey: process.env.GEMINI_KEY }).build();

app.post('/api/agent', async (req, res) => {
  const result = await workflow.invoke(req.body);
  res.json(result);
});
```

---

**Tip:** Always use `.build()` to get the workflow object before calling `invoke`. Use `init()` for runtime overrides.
