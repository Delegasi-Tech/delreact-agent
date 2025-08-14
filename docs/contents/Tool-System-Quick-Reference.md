---
sidebar_position: 5
title: Tool System
description: Quick reference for tool system API
---

# Quick Reference

A concise cheat sheet for creating and using tools with the LGraph agent framework.

---

## 1. Generate Tools

```typescript
import { createAgentTool } from "../core";

const myTool = createAgentTool({
  name: "my-tool",
  description: "Describe what this tool does.",
  schema: {
    foo: { type: "string", description: "A string input" },
    bar: { type: "number", description: "A number input" }
  },
  async run({ foo, bar }) {
    // Business logic here
    return { result: foo + bar };
  }
});
```

---

## 2. Add Tools to Agent Builder

```typescript
import { ReactAgentBuilder } from "../core";

const agentBuilder = new ReactAgentBuilder({
  openaiKey: "sk-...",
  sessionId: "my-session"
})
.addTool([
  myTool,
  // ...other tools
]);
```

---

## 3. Advanced: Use Custom Zod Schema

```typescript
import z from "zod";

const advancedTool = createAgentTool({
  name: "advanced-tool",
  description: "Advanced validation.",
  zodSchema: z.object({
    foo: z.string().min(3),
    bar: z.number().int(),
  }),
  async run({ foo, bar }) {
    // ...
  }
});
```
