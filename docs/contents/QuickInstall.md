---
id: quick-install
slug: /resources/quick-install
sidebar_position: 0
---

# Quick Install

A fast guide to get DelReact Agent up and running in your project.

## 1. Install Package

```bash
npm i delreact-agent
# npm i dotenv
```

- Requires Node.js >= 18, npm >= 8, TypeScript >= 4.7 (for TS projects)

## 2. Set Up Environment Variables

Create a `.env` file in your project root:

```bash
GEMINI_KEY=your_gemini_api_key  # Pick One or Both
OPENAI_KEY=your_openai_api_key  # Pick One or Both
```

## 3. Minimal Agent Example

```typescript
import dotenv from "dotenv";
import { ReactAgentBuilder } from "delreact-agent";

dotenv.config();

const agent = new ReactAgentBuilder({
  openaiKey: process.env.OPENAI_KEY,
  useEnhancedPrompt: true
})
.init({
  selectedProvider: 'openai',
  model: 'gpt-4o-mini',
  maxTasks: 8,
})
.build();

const result = await agent.invoke({
  objective: "What is GDP of second winner on 2022 World Cup?",
  outputInstruction: "Present it in structured sections: Summary, GDP, Year, Country"
});

console.log(result.conclusion);
```

---

For a more detailed walkthrough, see the [Quick Example](/resources/quick-example) or the [Agent Builder Reference](/ReactAgentBuilder-Quick-Reference).
