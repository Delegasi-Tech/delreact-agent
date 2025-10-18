---
sidebar_position: 4
title: Custom Agent Prompt
description: Learn how to customize agent prompts for specialized behavior in DelReact
---

# Custom Agent Prompt

DelReact allows you to customize the behavior of individual agents by providing custom prompts. This powerful feature enables you to create specialized agent behaviors for specific domains, industries, or use cases.

## Overview

The custom agent prompt system allows you to override the default prompts used by DelReact's core agents:

- **TaskBreakdownAgent** - Breaks down objectives into actionable tasks
- **TaskReplanningAgent** - Replans and adjusts tasks based on progress
- **ActionAgent** - Executes individual tasks
- **SummarizerAgent** - Creates final summaries and conclusions
- **EnhancePromptAgent** - Enhances and refines user prompts

## Basic Configuration

To use custom prompts, provide a `prompts` object when creating your ReactAgentBuilder:

```typescript
import { ReactAgentBuilder, TaskBreakdownParams, ActionAgentParams } from "delreact-agent";

const builder = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  prompts: {
    taskBreakdown: (params: TaskBreakdownParams) => {
      return `Custom task breakdown prompt for: ${params.objective}`;
    },
    actionAgent: (params: ActionAgentParams) => {
      return `Custom action execution for: ${params.currentTask}`;
    }
  }
});
```

## Available Agent

### 1. TaskBreakdown Agent

Customizes how objectives are broken down into tasks.

```typescript
taskBreakdown: (params: TaskBreakdownParams) => {
  return `You are a specialized task planner for ${domain}.

  Break down this objective into ${params.maxTasks} or fewer practical steps:
  "${params.objective}"

  Consider these constraints:
  - Focus on ${industry}-specific requirements
  - Always end with "[summarize]" task
  - Return semicolon-separated list only

  Additional context: ${params.sessionContext}`;
}
```

**Parameters (TaskBreakdownParams):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `objective` | string | The user's main goal that needs to be broken down |
| `maxTasks` | number | Maximum number of tasks to generate (typically 5-8) |
| `ragGuidance` | string | RAG system guidance if enabled |
| `sessionContext` | string | Previous conversation context and memory |
| `documentContext` | string | Context from processed documents (images, PDFs, etc.) |
| `state` | AgentState | Current agent state with tasks, results, and execution history |
| `config` | Record | Runtime configuration including provider settings |

### 2. Action Agent 

Customizes how individual tasks are executed.

```typescript
actionAgent: (params: ActionAgentParams) => {
  return `You are a ${role} expert.

  Execute this specific task: "${params.currentTask}"

  For objective: "${params.objective}"

  Guidelines:
  - Provide ${style} responses
  - Consider ${industry} best practices
  - Be concise and actionable

  Context: ${params.sessionContext}`;
}
```

**Parameters (ActionAgentParams):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `objective` | string | The overall goal the task contributes to |
| `currentTask` | string | The specific task being executed right now |
| `sessionContext` | string | Accumulated conversation and memory context |
| `documentContext` | string | Relevant information from processed files |
| `state` | AgentState | Current workflow state with previous results |
| `config` | Record | Configuration settings and runtime parameters |

### 3. Task Replanning Agent

Customizes how tasks are adjusted during execution.

```typescript
taskReplanning: (params: TaskReplanningParams) => {
  return `As a ${role} specialist, review and adjust the task plan.

  Objective: "${params.objective}"
  Completed: ${params.actionedTasks.join(", ")}
  Current plan: ${params.currentTasks.join(", ")}
  Recent results: ${params.actionResults.join(", ")}

  Create an improved task sequence considering ${domain} requirements.
  Return only semicolon-separated tasks that still need completion.`;
}
```

**Parameters (TaskReplanningParams):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `objective` | string | The main goal being pursued |
| `actionedTasks` | string[] | Array of completed tasks |
| `currentTasks` | string[] | Array of remaining tasks in current plan |
| `actionResults` | string[] | Results from completed tasks |
| `ragGuidance` | string | RAG system guidance for replanning |
| `sessionContext` | string | Session memory and conversation context |
| `documentContext` | string | Document-derived context |
| `state` | AgentState | Current agent state |
| `config` | Record | Configuration settings |

### 4. Summarize Agent

Customizes final summary generation.

```typescript
summarizerAgent: (params: SummarizerAgentParams) => {
  return `You are a ${role} report writer.

  Summarize these results for: "${params.objective}"

  Results: ${params.actionResults.join("\n")}

  Format Requirements:
  ${params.formatInstruction}

  Style: ${reportStyle}
  Focus: ${keyAspects}`;
}
```

**Parameters (SummarizerAgentParams):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `objective` | string | The original goal that was pursued |
| `actionResults` | string[] | All results from completed tasks |
| `formatInstruction` | string | Specific formatting requirements from user |
| `sessionContext` | string | Session conversation context |
| `documentContext` | string | Context from processed documents |
| `state` | AgentState | Current agent state |
| `config` | Record | Configuration settings |

### 5. EnhancePrompt Agent

Customizes prompt enhancement behavior.

```typescript
enhancePrompt: (params: EnhancePromptParams) => {
  return `You are a ${domain} prompt enhancement specialist.

  Enhance this prompt for better ${industry} outcomes:
  "${params.objective}"

  Use the required format with initial enhancement, critique, and final enhancement.
  Focus on ${domain}-specific terminology and best practices.`;
}
```

**Parameters (EnhancePromptParams):**

| Parameter | Type | Description |
|-----------|------|-------------|
| `objective` | string | The original user prompt that needs enhancement |
| `sessionContext` | string | Previous conversation context for enhancement |
| `documentContext` | string | Context from uploaded documents |
| `state` | AgentState | Current agent state |
| `config` | Record | Configuration settings |

## Real-World Examples

### Example 1: Career Advisor Agent

```typescript
const careerAdvisor = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  prompts: {
    taskBreakdown: (params: TaskBreakdownParams) => {
      return `You are a career advisor specializing in the Indonesian job market.

      Break down this career objective into practical, actionable steps:
      "${params.objective}"

      Consider:
      - Indonesian job market trends
      - Local industry requirements
      - Professional development paths
      - Maximum ${params.maxTasks} tasks
      - End with "[summarize]"

      Return semicolon-separated list only.`;
    },

    actionAgent: (params: ActionAgentParams) => {
      return `You are a career counselor with expertise in Indonesian employment.

      Complete this career-related task: "${params.currentTask}"
      For objective: "${params.objective}"

      Provide practical, Indonesia-specific advice that considers:
      - Local job market conditions
      - Cultural workplace norms
      - Available resources and platforms
      - Professional development opportunities`;
    },

    summarizerAgent: (params: SummarizerAgentParams) => {
      return `You are a professional career advisor creating a comprehensive career plan.

      Summarize this career guidance for: "${params.objective}"

      Results: ${params.actionResults.join("\n")}

      Format as a structured career action plan with:
      - Immediate next steps (1-2 weeks)
      - Short-term goals (1-3 months)
      - Medium-term objectives (6-12 months)
      - Key resources and contacts
      - Success metrics

      ${params.formatInstruction}`;
    }
  }
});
```

### Example 2: Technical Documentation Agent

```typescript
const techDocAgent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  prompts: {
    taskBreakdown: (params: TaskBreakdownParams) => {
      return `You are a technical documentation specialist.

      Break down this documentation objective: "${params.objective}"

      Structure should include:
      - Requirements analysis
      - Architecture overview
      - Implementation details
      - Testing procedures
      - Deployment guide

      Maximum ${params.maxTasks} tasks, end with "[summarize]"
      Return semicolon-separated list only.`;
    },

    actionAgent: (params: ActionAgentParams) => {
      return `You are a technical writer creating developer documentation.

      Complete: "${params.currentTask}"
      For: "${params.objective}"

      Guidelines:
      - Use clear, concise technical language
      - Include code examples where relevant
      - Consider different skill levels
      - Follow documentation best practices
      - Be accurate and up-to-date`;
    }
  }
});
```

### Example 3: Business Analysis Agent

```typescript
const businessAnalyst = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  prompts: {
    taskBreakdown: (params: TaskBreakdownParams) => {
      return `You are a senior business analyst specializing in market research.

      Break down this business analysis objective: "${params.objective}"

      Structure your analysis to include:
      - Market landscape assessment
      - Competitive analysis
      - Financial projections
      - Risk assessment
      - Strategic recommendations

      Maximum ${params.maxTasks} tasks, conclude with "[summarize]"
      Return semicolon-separated list only.`;
    },

    actionAgent: (params: ActionAgentParams) => {
      return `You are a business analyst with expertise in ${industry} markets.

      Execute: "${params.currentTask}"
      Objective: "${params.objective}"

      Approach:
      - Use data-driven insights
      - Apply business frameworks (SWOT, Porter's 5 Forces, etc.)
      - Consider market dynamics
      - Provide actionable recommendations
      - Support with relevant metrics`;
    },

    summarizerAgent: (params: SummarizerAgentParams) => {
      return `You are creating an executive business analysis report.

      Objective: "${params.objective}"
      Analysis Results: ${params.actionResults.join("\n")}

      Structure as professional business report:
      - Executive Summary
      - Key Findings
      - Market Opportunities
      - Risk Factors
      - Strategic Recommendations
      - Next Steps

      ${params.formatInstruction}`;
    }
  }
});
```