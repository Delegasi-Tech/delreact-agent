---
sidebar_position: 1
---

# Welcome to DelReact

**DelReact** is a powerful TypeScript framework for building reactive agent systems with advanced features like Memory management, Tool integration, and MCP (Model Context Protocol) support.

## What is DelReact?

DelReact is an agent-based task planning framework built on LangChain LangGraph that enables you to:

- 🤖 **Build Reactive Agents** - Create intelligent agents that can plan and execute complex tasks
- 🧠 **Memory Management** - Built-in memory systems (In-Memory, Redis, PostgreSQL)
- 🛠️ **Tool Integration** - Seamlessly integrate external tools and APIs
- 🔗 **MCP Support** - Model Context Protocol for external tool integration
- 🔍 **RAG Integration** - Retrieval-Augmented Generation capabilities
- 📊 **Subgraph Builder** - Build complex agent interaction graphs

## Quick Start

### Installation

```bash
npm install delreact-agent
```

### Basic Usage

```typescript
import { ReactAgentBuilder } from 'delreact-agent';

const agent = new ReactAgentBuilder()
  .setLLM(llm)
  .setMemory(memory)
  .addTool(tool)
  .build();

const result = await agent.invoke("Your task here");
```

## What's Next?

- 📖 **[ReactAgent Builder Guide](./ReactAgentBuilder-Guide.md)** - Learn the fundamentals
- 🛠️ **[Tool System](./Tool-System-Guide.md)** - Integrate external tools
- 🧠 **[Memory Management](./memory/)** - Persistent agent memory
- 🔗 **[MCP Integration](./MCP-Integration-Guide.md)** - External tool protocols
- 🔍 **[RAG Integration](./RAG-Integration-Guide.md)** - Retrieval-augmented generation

## Examples

Check out our comprehensive examples in the `/example` directory:
- Customer Support Agent
- Financial Calculator
- Research Assistant
- Custom Workflows