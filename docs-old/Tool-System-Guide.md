# LGraph Tool System Guide

A simple and powerful tool system that enables automatic tool injection, custom tool registration, and seamless integration with the LGraph agent framework.

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
import { ReactAgentBuilder } from "./core";

const agent = new ReactAgentBuilder({
  geminiKey: "your-gemini-key",
  openaiKey: "your-openai-key"
});

// Default tools (web-search, fetch-page-to-markdown, enhance-prompt) 
// are automatically available
const result = await agent.invoke({
  objective: "Search for current TypeScript best practices and summarize them"
});
```

### 2. Adding Custom Tools

```typescript
import { addTool } from "./tools";
import { tool } from "@langchain/core/tools";
import z from "zod";

// Create your custom tool
const myCustomTool = tool(
  async ({ input }: { input: string }) => {
    // Your tool logic here
    return `Processed: ${input}`;
  },
  {
    name: "my-custom-tool",

# LGraph Tool System Guide

This guide explains how to create, register, and use custom tools in the LGraph agent framework using the `createAgentTool` abstraction and the `ReactAgentBuilder`.

---

## 1. Generate Tools with `createAgentTool`

Define a tool with a simple, type-safe schema and business logic only:

```typescript
import { createAgentTool } from "../core";

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
import { ReactAgentBuilder } from "../core";

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

For more, see the full API docs and examples in the `/docs` folder.
// Check registry state
const stats = getToolStats();
console.log(`${stats.totalTools} tools: ${stats.toolNames.join(", ")}`);
```

### BaseAgent Tool Methods

```typescript
class MyAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>) {
    // Get available tools
    const tools = this.getAvailableTools();
    
    // Get tool statistics
    const stats = this.getToolStats();
    
    // Register agent-specific tools
    this.registerAgentTools([specialTool]);
    
    // Call LLM with automatic tool injection
    const result = await this.callLLM(prompt, config);
    
    // Or call without tools (simple case)
    const simpleResult = await this.callLLMSimple(prompt, config);
  }
}
```

## 🧪 Testing Your Tools

```typescript
// Run the comprehensive test suite
import { main } from "./testToolSystem";
await main();

// Or test individual components
import { testToolRegistry, testAgentWithTools } from "./testToolSystem";
await testToolRegistry();
await testAgentWithTools();
```

## 🔄 Integration Examples

### Example 1: Data Analysis Tool

```typescript
const dataAnalysisTool = tool(
  async ({ data, analysisType }: { data: string; analysisType: string }) => {
    const parsedData = JSON.parse(data);
    
    switch (analysisType) {
      case "summary":
        return generateSummary(parsedData);
      case "trends":
        return analyzeTrends(parsedData);
      default:
        return "Unknown analysis type";
    }
  },
  {
    name: "data-analysis",
    description: "Analyze datasets with various analysis types (summary, trends, correlations)",
    schema: z.object({
      data: z.string().describe("JSON string containing the dataset"),
      analysisType: z.enum(["summary", "trends", "correlations"])
    })
  }
);
```

### Example 2: API Integration Tool

```typescript
const apiCallTool = tool(
  async ({ endpoint, method, payload }: { endpoint: string; method: string; payload?: string }) => {
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(JSON.parse(payload)) : undefined
    });
    
    const result = await response.json();
    return `API Response: ${JSON.stringify(result)}`;
  },
  {
    name: "api-call",
    description: "Make HTTP API calls to external services",
    schema: z.object({
      endpoint: z.string().describe("The API endpoint URL"),
      method: z.enum(["GET", "POST", "PUT", "DELETE"]),
      payload: z.string().optional().describe("JSON payload for request body")
    })
  }
);
```

## 🎯 Multi-Agent Scenarios

The tool system enables powerful multi-agent workflows:

```typescript
// Agent A: Data Collection
const dataAgent = new ReactAgentBuilder({ geminiKey, openaiKey });
await dataAgent.invoke({
  objective: "Collect financial data for Q1 analysis using custom-financial-analysis tool"
});

// Agent B: Report Generation (automatically has access to the same tools)
const reportAgent = new ReactAgentBuilder({ geminiKey, openaiKey });
await reportAgent.invoke({
  objective: "Generate executive summary using the financial data tools and web research"
});
```

## 🔮 Future Enhancements

The current implementation provides a foundation for:

1. **Memory Integration**: Tools automatically storing results in shared memory
2. **Agent-Specific Tool Filtering**: Different tools for different agent types
3. **Tool Composition**: Tools that call other tools
4. **Conditional Tool Loading**: Dynamic tool registration based on context
5. **Tool Result Caching**: Performance optimization for repeated calls

## 🎊 Summary

The Simple Tool Registry Architecture provides:

- ✅ **Zero Configuration**: Default tools work immediately
- ✅ **Easy Extension**: Add custom tools with one function call
- ✅ **Automatic Integration**: Tools are available to all agents
- ✅ **Type Safety**: Full TypeScript support with Zod validation
- ✅ **Developer Friendly**: Clear APIs and comprehensive examples

Start using tools today with minimal setup, and extend the system as your needs grow! 