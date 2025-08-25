---
sidebar_position: 4
title: Tool System Guide
description: Complete guide to the DelReact tool system
---

# User Guide

A simple and powerful tool system that enables automatic tool injection, custom tool registration, and seamless integration with the DelReact agent framework.

## 🎯 Overview

The Tool System provides:
- **Automatic Tool Injection**: Tools are automatically available to agents via the Tool Registry
- **Custom Tool Registration**: Developers can easily add their own tools
- **Cross-Agent Tool Sharing**: Tools registered once are available to all agents
- **Memory Integration Ready**: Foundation for future memory-aware tool execution

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Tool Registry │◄───┤   BaseAgent      │◄───┤  Custom Agent   │
│   (Singleton)   │    │   (Enhanced)     │    │  (Your Code)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Default Tools   │    │   LLM Call       │    │ Agent-Specific  │
│ - Web Search    │    │ (Tool Injection) │    │ Tools           │
│ - Fetch Page    │    │                  │    │                 │
│ - Enhance Prompt│    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Using Default Tools (No Setup Required)

```typescript
import { ReactAgentBuilder } from "delreact-agent";

const agent = new ReactAgentBuilder({
  geminiKey: "your-gemini-key"
});

// Default tools (web-search, fetch-page-to-markdown, enhance-prompt) 
// are automatically available
const result = await agent.invoke({
  objective: "Search for current TypeScript best practices and summarize them"
});
```

# DelReact Tool System Guide

This guide explains how to create, register, and use custom tools in the DelReact agent framework using the `createAgentTool` abstraction and the `ReactAgentBuilder`.

---

## 1. Generate Tools with `createAgentTool`

Define a tool with a simple, type-safe schema and business logic only:

```typescript
import { createAgentTool } from "delreact-agent";

const breakEvenCalculatorTool = createAgentTool({
  name: "break-even-calculator",
  description: "Calculate the break-even point (units and revenue) for a business.",
  schema: {
    fixedCosts: { type: "number", description: "Total fixed costs in dollars" },
    variableCostPerUnit: { type: "number", description: "Variable cost per unit in dollars" },
    sellingPricePerUnit: { type: "number", description: "Selling price per unit in dollars" },
    agentConfig: { type: "object", description: "Agent configuration (optional)", optional: true }
  },
  async run({ fixedCosts, variableCostPerUnit, sellingPricePerUnit }) {
    const bepUnits = fixedCosts / (sellingPricePerUnit - variableCostPerUnit);
    return { breakEvenUnits: Math.ceil(bepUnits) };
  }
});
```

- No need to import or use `zod` or `tool` directly.
- For advanced validation, you can pass a `zodSchema` instead of `schema`.

---

## 2. Add Tools to Agent Builder

Register your tools with the agent builder using `.addTool()`:

```typescript
import { ReactAgentBuilder } from "delreact-agent";

const agentBuilder = new ReactAgentBuilder({
  openaiKey: "sk-...",
  geminiKey: "...",
  sessionId: "my-session"
})
.addTool([
  breakEvenCalculatorTool,
  // ...other tools
]);
```

- You can add multiple tools at once as an array.
- Tools are registered globally for the agent instance.

---

## 3. Build, Init, and Invoke the Agent

### Build and Initialize

```typescript
const agent = agentBuilder.init({
  selectedProvider: "openai",
  model: "gpt-4.1-mini"
}).build();
```

### Invoke the Agent

```typescript
const result = await agent.invoke({
  objective: "Analyze break-even for a SaaS business",
  outputInstruction: "Summarize the financial position."
});

console.log(result.conclusion);
```

- The `invoke` method runs the full agent workflow with your tools.
- The result includes the agent's conclusion and full state.

---

## 4. Quick Reference

| Step         | Code Example (TypeScript)                                         |
|--------------|--------------------------------------------------------------------|
| Create Tool  | `const myTool = createAgentTool({ ... });`                         |
| Add Tool(s)  | `agentBuilder.addTool([myTool, ...]);`                             |
| Build & Init | `const agent = agentBuilder.init({ ... }).build();`                |
| Invoke Agent | `const result = await agent.invoke({ objective, outputInstruction });` |

---

## 5. Advanced: Custom Zod Schema

```typescript
import z from "zod";

const advancedTool = createAgentTool({
  name: "advanced-tool",
  description: "Tool with advanced validation.",
  zodSchema: z.object({
    foo: z.string().min(3),
    bar: z.union([z.number(), z.string()]),
    baz: z.array(z.boolean())
  }),
  async run({ foo, bar, baz }) {
    // ...
  }
});
```
---
For more, see the full examples in the `/examples` folder.
Start using tools today with minimal setup, and extend the system as your needs grow! 