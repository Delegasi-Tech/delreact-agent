---
sidebar_position: 13
title: Custom Workflow
description: Quick reference for custom workflows
---

# Quick Reference

## Basic Agent Creation Pattern
```typescript
import { ReactAgentBuilder } from "../";

const builder = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    openaiKey: process.env.OPENAI_KEY
});

const MyAgent = builder.createAgent({
    name: "MyAgent",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Process user requests and provide helpful responses"
});

// Usage
const result = await MyAgent.invoke("Analyze this text for sentiment");
```

## Custom Workflow Pattern


### Linear Workflow
```typescript
const workflow = builder
    .createWorkflow("MyWorkflow")
    .start(IdentificationAgent)
    .then(ActionAgent)
    .then(SummaryAgent)
    .build();

const result = await workflow.invoke({ objective: "Handle support request" });
```

### Branching Worfklow

```typescript
const mainFlow = builder.createWorkflow("MyWorkflow");

mainFlow.start(GateAgent);

const { ifTrue: processPath, ifFalse: rejectPath } = mainFlow.branch({
    condition: (state) => state.actionResults[0].includes('yes'),
    ifTrue: ProcessAgent,
    ifFalse: RejectAgent
});

mainFlow.merge([processPath, rejectPath])
    .then(SummaryAgent);

const workflow = mainFlow.build();
const result = await workflow.invoke({ objective: "Handle support request" });
```

## API Cheat Sheet

| Method | Purpose | Example |
|--------|---------|---------|
| `builder.createAgent(config)` | Create individual agent | `builder.createAgent({ name: "Analyzer", ... })` |
| `builder.createWorkflow(name)` | Initialize workflow builder | `builder.createWorkflow("SupportFlow")` |
| `.start(agent)` | Set first agent | `.start(GateAgent)` |
| `.then(agent)` | Add sequential agent | `.then(ProcessAgent)` |
| `.branch(config)` | Boolean routing - returns `{ifTrue, ifFalse}` | `.branch({ condition: (s) => s.valid, ifTrue: A, ifFalse: B })` |
| `.switch(config)` | Multi-way routing - returns object with case keys | `.switch({ condition: (s) => s.type, cases: {...} })` |
| `.merge(paths)` | Merge workflow paths | `.merge([pathA, pathB, pathC])` |
| `.build()` | Compile workflow | `.build()` |
| `agent.invoke(objective)` | Execute single agent | `agent.invoke("Analyze data")` |
| `workflow.invoke(request)` | Execute workflow | `workflow.invoke({ objective: "..." })` |
| `agent.getConfig()` | Get agent configuration | `agent.getConfig()` |


## Agent Configuration

### Basic AgentConfig
```typescript
{
    name: "AgentName",
    provider: "openai" | "gemini",
    model: "gpt-4o-mini" | "gemini-1.5-flash",
    apiKey?: "custom-key",
    description: "Agent's role and purpose",
    
    // RAG (Retrieval Augmented Generation) integration
    rag?: {
        vectorFiles: string[];        // Required: JSON vector database files
        embeddingModel: string;       // Required: e.g., "text-embedding-3-small"
        threshold?: number;           // Default: 0.7 - Similarity threshold (0-1)
        topK?: number;               // Default: 5 - Max results to retrieve
    },
    
    // Memory settings (scientifically calibrated defaults)
    memory?: {
        rememberLastSteps?: 3,        // Previous workflow steps to include
        maxTextPerStep?: 120,         // Character limit per step result  
        includeWorkflowSummary?: true // Show full workflow overview
    },
    
    // Optional customization
    errorStrategy?: "fallback" | "fail-fast",
    maxTokens?: 2000,
    tools?: AgentTool[]
}
```

### Custom Task Functions
```typescript
{
    // Custom planning logic
    planTask?: (ctx: AgentContext) => Promise<{
        canExecute: boolean;
        plan: string;
        reason?: string;
    }>,
    
    // Custom processing logic
    processTask?: (ctx: AgentContext) => Promise<string>,
    
    // Custom validation logic
    validateTask?: (ctx: AgentContext & { result: string }) => Promise<{
        status: 'confirmed' | 'error';
        reason?: string;
    }>
}
```


## RAG-Enhanced Agent Pattern
```typescript
const KnowledgeAgent = builder.createAgent({
    name: "CustomerSupport",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Answer customer questions using company knowledge base",
    rag: {
        vectorFiles: ["/path/to/knowledge.json"],
        embeddingModel: "text-embedding-3-small",
        threshold: 0.5,  // Lower = more results, higher = more precise
        topK: 3          // Number of relevant chunks to retrieve
    }
});

// Usage - automatically searches knowledge base first
const result = await KnowledgeAgent.invoke("How do I reset my password?");
```

## RAG Configuration Quick Reference

| Property | Purpose | Example | Default |
|----------|---------|---------|---------|
| `vectorFiles` | Knowledge base files | `["/path/to/docs.json"]` | Required |
| `embeddingModel` | Embedding model | `"text-embedding-3-small"` | Required |
| `threshold` | Similarity threshold (0-1) | `0.5` (balanced), `0.7` (precise), `0.3` (broad) | `0.7` |
| `topK` | Max results to retrieve | `3` (focused), `5` (standard), `10` (comprehensive) | `5` |

## Workflow Routing

### Branch (2-way) - Returns (ifTrue, ifFalse)
```typescript
const { ifTrue: approvalPath, ifFalse: rejectionPath } = mainFlow.branch({
    condition: (state) => state.actionResults[0].toLowerCase().includes('yes'),
    ifTrue: ApprovalAgent,
    ifFalse: RejectionAgent
});
```

### Switch (N-way) - Returns Object with Case Keys + Default
```typescript
const { billing, technical, account, default: general } = successPath.switch({
    condition: (state) => {
        const result = state.lastResult;
        if (result.includes('billing')) return 'billing';
        if (result.includes('technical')) return 'technical';
        if (result.includes('account')) return 'account';
        return 'default';
    },
    cases: {
        "billing": BillingAgent,
        "technical": TechnicalAgent,
        "account": AccountAgent
    },
    default: GeneralAgent
});
```

### Merge Paths
```typescript
const { billing, technical, account, default: general } = successPath.switch({...});

mainFlow.merge([billing, technical, account, general])
    .then(FinalSummaryAgent);
```

## Memory Configuration Examples

### Minimal Context (Fast)
```typescript
memory: {
    rememberLastSteps: 1,
    maxTextPerStep: 50,
    includeWorkflowSummary: false
}
```

### Standard Context (Recommended)
```typescript
memory: {
    rememberLastSteps: 3,      // Default
    maxTextPerStep: 120,       // Default
    includeWorkflowSummary: true // Default
}
```

### Rich Context (Detailed)
```typescript
memory: {
    rememberLastSteps: 5,
    maxTextPerStep: 200,
    includeWorkflowSummary: true
}
```

## Common Workflow Patterns

### Linear Pipeline
```typescript
const workflow = builder.createWorkflow("LinearPipeline")
    .start(InputAgent)
    .then(ProcessAgent)
    .then(OutputAgent)
    .build();
```

### Conditional Processing
```typescript
const mainFlow = builder.createWorkflow("ConditionalFlow");

mainFlow.start(ValidateAgent);

const { ifTrue: processPath, ifFalse: errorPath } = mainFlow.branch({
    condition: (state) => state.actionResults[0].includes('valid'),
    ifTrue: ProcessAgent,
    ifFalse: ErrorAgent
});

const workflow = mainFlow.build();
```

### Multi-Path Routing  
```typescript
const mainFlow = builder.createWorkflow("SupportRouter");

mainFlow.start(ClassifyAgent);

const { billing, technical, account, default: general } = mainFlow.switch({
    condition: (state) => extractCategory(state.actionResults[0]),
    cases: {
        "billing": BillingAgent,
        "technical": TechnicalAgent,
        "account": AccountAgent
    },
    default: GeneralAgent
});

mainFlow.merge([billing, technical, account, general])
    .then(SummaryAgent);

const workflow = mainFlow.build();
```

### Real-World Customer Support Workflow
```typescript
// Gate agent for intent detection
const GateQuestionAgent = builder.createAgent({
    name: "GateQuestion",
    model: "gemini-2.0-flash",
    provider: "gemini",
    description: "Analyze user intent. Output 'yes' to start support, 'no' otherwise."
});

// Classification agent for issue routing  
const IdentifyIssueAgent = builder.createAgent({
    name: "IdentifyIssue",
    model: "gpt-4.1-mini", 
    provider: "openai",
    description: "Categorize as: 'billing', 'technical', 'account', or 'general'. Output one word."
});

// RAG-powered support agents
const AccountSupportAgent = builder.createAgent({
    name: "AccountSupport",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Handle account issues with knowledge base",
    rag: {
        vectorFiles: [join(__dirname, '../asset/account-support.json')],
        embeddingModel: "text-embedding-3-small",
        threshold: 0.5,
        topK: 3
    }
});

// Workflow implementation
async function buildCustomerSupportWorkflow() {
    const mainFlow = builder.createWorkflow("CustomerServiceWorkflow", {
        debug: true,
        timeout: 80000
    });

    mainFlow.start(GateQuestionAgent);

    const { ifTrue: successPath, ifFalse: feedbackPath } = mainFlow.branch({
        condition: (state) => state.lastActionResult?.toLowerCase().includes('yes'),
        ifTrue: IdentifyIssueAgent,
        ifFalse: RequestFeedbackAgent,
    });

    const { billing, technical, account, default: general } = successPath.switch({
        condition: (state) => {
            const result = state.lastActionResult || '';
            if (result.toLowerCase().includes('billing')) return 'billing';
            if (result.toLowerCase().includes('technical')) return 'technical';
            if (result.toLowerCase().includes('account')) return 'account';
            return 'default';
        },
        cases: {
            "billing": BillingSupportAgent,
            "technical": TechnicalSupportAgent,
            "account": AccountSupportAgent,
        },
        default: GeneralSupportAgent
    });

    mainFlow.merge([billing, technical, account, general, feedbackPath])
        .then(SummarizeInteractionAgent);

    return mainFlow.build();
}
```

## 3-Phase Agent Execution

Every custom agent follows **Plan → Process → Validate** workflow:

### 1. Planning Phase
- Analyzes the task and workflow context
- Creates execution plan
- Uses configurable memory settings
- Can be customized via `planTask` function

### 2. Processing Phase  
- Executes the planned task
- Has access to full workflow context
- Can be customized via `processTask` function

### 3. Validation Phase
- Validates execution results
- Provides fallback for workflow progression
- Can be customized via `validateTask` function

## Error Handling

### Agent Level
```typescript
{
    errorStrategy: "fallback",  // Continue with error message
    errorStrategy: "fail-fast"  // Stop workflow immediately
}
```

### Workflow Level
- Agents with `fallback` strategy log errors and continue
- Failed validation defaults to success for workflow progression
- Context building has defensive error handling

## Integration Examples

### With Individual Agents
```typescript
const analyzer = builder.createAgent({
    name: "DataAnalyzer", 
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Analyze data patterns and trends",
    memory: { rememberLastSteps: 2 }
});

const result = await analyzer.invoke("Analyze sales data trends");
console.log(result.result);
console.log(result.plannedTask);
```

### With Custom Memory Settings
```typescript
const detailedAgent = builder.createAgent({
    name: "DetailedProcessor",
    model: "gpt-4o-mini", 
    provider: "openai",
    description: "Process complex requests with rich context",
    memory: {
        rememberLastSteps: 5,
        maxTextPerStep: 300,
        includeWorkflowSummary: true
    }
});
```

### With Custom Task Functions
```typescript
const customAgent = builder.createAgent({
    name: "CustomAgent",
    model: "gpt-4o-mini",
    provider: "openai", 
    description: "Agent with custom logic",
    planTask: async (ctx) => {
        // Custom planning logic
        return {
            canExecute: true,
            plan: "Custom execution plan",
            reason: "Using custom planner"
        };
    },
    processTask: async (ctx) => {
        // Custom processing logic
        return "Custom processing result";
    }
});
```

## Model Selection Quick Guide

| Use Case | Recommended Model | Provider | Why |
|----------|------------------|----------|-----|
| **Fast Classification** | `gemini-2.0-flash` | Gemini | Speed, cost-effective |
| **Detailed Analysis** | `gpt-4o-mini` | OpenAI | Better reasoning |
| **High-Volume Processing** | `gemini-2.5-flash` | Gemini | Throughput, efficiency |
| **RAG-Enhanced Support** | `gpt-4o-mini` | OpenAI | Good with tools |
| **Simple Routing** | `gemini-2.0-flash` | Gemini | Fast, reliable |

## RAG Best Practices Quick Tips

```typescript
// Good threshold settings by use case
threshold: 0.8    // Precise: technical docs, exact procedures  
threshold: 0.5    // Balanced: customer support, general Q&A
threshold: 0.3    // Broad: research, exploration

// Optimize topK by content density
topK: 3          // Focused: specific procedures, direct answers
topK: 5          // Standard: balanced coverage 
topK: 10         // Comprehensive: complex topics, research
```

## Debugging Tips

1. **Check Agent Configuration**:
   ```typescript
   const config = MyAgent.getConfig();
   console.log("Memory settings:", config.memory);
   console.log("RAG config:", config.rag);
   ```

2. **Monitor Workflow State**:
   ```typescript
   const workflow = builder.createWorkflow("DebugFlow", { debug: true });
   ```

3. **Test RAG Search**:
   ```typescript
   // Add debug logging for RAG searches
   const result = await agent.invoke("test query", { debug: true });
   // Check console for similarity scores and retrieved chunks
   ```

4. **Test Conditions Separately**:
   ```typescript
   const testCondition = (state) => {
       console.log("State:", state.actionResults);
       const result = state.actionResults[0].includes('yes');
       console.log("Condition result:", result);
       return result;
   };
   ```

5. **Validate Agent Results**:
   ```typescript
   const result = await agent.invoke(objective);
   console.log("Result:", result.result);
   console.log("Planned task:", result.plannedTask);
   ```

## Key API Differences from SubgraphBuilder

- **Branch Returns Object**: `.branch()` returns `{ifTrue: path, ifFalse: path}` instead of continuing the chain
- **Switch Returns Object**: `.switch()` returns object with case names as keys plus `default` key
- **Explicit Merge Required**: Use `.merge([path1, path2, ...])` to combine paths back together
- **Path-Based Building**: Build workflow by capturing and merging paths rather than chaining

## Performance Notes

- **Memory Settings**: Default settings optimized for 80% of use cases
- **Context Size**: ~150-200 tokens total (3-5% of model limits)
- **Token Efficiency**: Configurable limits prevent overflow
- **Execution Speed**: Minimal overhead vs direct LLM calls