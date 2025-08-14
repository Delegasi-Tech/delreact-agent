---
sidebar_position: 1
---

# Welcome to DelReact Agent

DelReact Agent is a robust, extensible framework for building intelligent AI agents that can autonomously plan, reason, and act to accomplish complex, multi-step tasks.

## What is DelReact?

DelReact is inspired by the ReAct Agent Architecture—a paradigm where a single agent, powered by a large language model (LLM), iteratively cycles through Thought, Action, and Observation.

Built on top of LangChain and LangGraph, DelReact provides:
- A pre-defined agent pipeline (ReactAgentBuilder) for orchestrating multi-step workflows
- Dynamic tool integration (including web search, content fetching, and custom business tools)
- Agent Memory and Session Observability
- Advanced error handling and dynamic replanning
- Support for multiple LLM providers (Gemini, OpenAI, OpenRouter)
- Extensible architecture for custom agents, tools, and workflows

## Quick Start

### Installation & Setup

```bash
npm i delreact-agent
```

Set up environment variables:
```bash
# .env
GEMINI_KEY=your_gemini_api_key
OPENAI_KEY=your_openai_api_key  # Optional
```

### Basic Usage

```typescript
import { ReactAgentBuilder } from "delreact-agent";

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY  // Optional
})
.init({
  selectedProvider: 'gemini',
  model: 'gemini-2.5-flash'
})
.build();

const result = await agent.invoke({
  objective: "Plan a marketing campaign for a new product launch",
  outputInstruction: "Structured plan with timeline and budget"
});

console.log(result.conclusion);
```

### Architecture

![DelReact Agent Workflow](./delreact-flow.png)
