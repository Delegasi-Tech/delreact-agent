# SubgraphBuilder Guide

The **SubgraphBuilder** eliminates 90% of the boilerplate code required to create agent subgraphs while providing advanced features like conditional routing, error handling, and retry logic.

## Quick Start

### Basic Linear Flow
```typescript
import { SubgraphBuilder } from "../SubgraphBuilder";
import { ResearchAgent, AnalysisAgent, SynthesisAgent } from "./subgraphAgents";

const ActionSubgraph = SubgraphBuilder
  .create("ActionSubgraph")
  .start(ResearchAgent)
  .then(AnalysisAgent)
  .then(SynthesisAgent)
  .build();

// Usage (same as original)
const result = await ActionSubgraph.execute(state, config);
```

### Advanced Features
```typescript
const AdvancedSubgraph = SubgraphBuilder
  .create("AdvancedSubgraph")
  .start(ResearchAgent)
  .then(AnalysisAgent, { temperature: 0.2, maxTokens: 1000 }) // Agent-specific config
  .switch({
    condition: (state) => state.taskType,
    cases: {
      "research": ResearchAgent,
      "analysis": AnalysisAgent,
      "synthesis": SynthesisAgent
    },
    default: SynthesisAgent
  })
  .withConfig({
    errorStrategy: "fallback",
    timeout: 30000,
    retries: 3
  })
  .build();
```

## API Reference

### Core Methods

#### `SubgraphBuilder.create(name: string)`
Creates a new subgraph builder instance.

#### `.start(agent: typeof BaseAgent, config?: AgentNodeConfig)`
Sets the starting agent. Must be called first.

#### `.then(agent: typeof BaseAgent, config?: AgentNodeConfig)`
Adds the next agent in sequence.

#### `.build()`
Compiles and returns a `CompiledSubgraph` instance.

### Conditional Routing

#### `.branch(config: BranchConfig)`
Simple boolean-based routing:
```typescript
.branch({
  condition: (state) => state.isValid,
  ifTrue: ProcessAgent,
  ifFalse: ErrorAgent
})
```

#### `.switch(config: SwitchConfig)`
Multiple condition routing:
```typescript
.switch({
  condition: (state) => state.taskType,
  cases: {
    "type1": Agent1,
    "type2": Agent2,
    "type3": Agent3
  },
  default: DefaultAgent
})
```

### Configuration

#### `.withConfig(config: SubgraphConfig)`
Sets global subgraph configuration:
```typescript
.withConfig({
  errorStrategy: "fallback" | "fail-fast" | "retry",
  timeout: 30000,        // Execution timeout in ms
  retries: 2,           // Number of retry attempts
  sessionId: "custom"   // Custom session ID
})
```

#### Agent-Specific Configuration
Pass configuration to individual agents:
```typescript
.then(AnalysisAgent, {
  temperature: 0.2,
  maxTokens: 1000,
  timeout: 15000
})
```

## Error Handling Strategies

### `"fallback"` (Default)
On error, logs the error and continues with a fallback response:
```typescript
{
  actionResults: [...existing, "Agent failed: error message"],
  currentTaskIndex: currentTaskIndex + 1
}
```

### `"fail-fast"`
Immediately throws the error, stopping execution.

### `"retry"`
Retries the failed operation with exponential backoff before falling back.

## Advanced Usage

### Custom Condition Functions
```typescript
const complexCondition = (state: AgentState) => {
  const task = state.tasks[state.currentTaskIndex];
  const complexity = task.split(' ').length;
  
  if (complexity > 10) return "complex";
  if (complexity > 5) return "moderate";
  return "simple";
};

const subgraph = SubgraphBuilder
  .create("ComplexRouting")
  .start(ClassifierAgent)
  .switch({
    condition: complexCondition,
    cases: {
      "complex": DetailedAnalysisAgent,
      "moderate": StandardAnalysisAgent,
      "simple": QuickAnalysisAgent
    }
  })
  .build();
```

### Integration with ReactAgentBuilder
```typescript
const reactAgent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY
})
.replaceActionNode(ActionSubgraph)
.buildGraph();

const result = await reactAgent.invoke({
  objective: "Analyze market trends"
});
```

### Accessing Compiled Graph
```typescript
const subgraph = SubgraphBuilder.create("Test").start(Agent1).build();

// For advanced LangGraph operations
const compiledGraph = subgraph.getCompiledSubgraph();
```

## Migration from Manual StateGraph

### Before (80+ lines)
```typescript
export class OldSubgraph {
  private static subgraph: any = null;
  
  static createSubgraph() {
    if (OldSubgraph.subgraph) return OldSubgraph.subgraph;
    
    const builder = new StateGraph({ channels: AgentStateChannels })
      .addNode("research", ResearchAgent.execute)
      .addNode("analysis", AnalysisAgent.execute)
      .addNode("synthesis", SynthesisAgent.execute)
      .addEdge(START, "research")
      .addEdge("research", "analysis")
      .addEdge("analysis", "synthesis")
      .addEdge("synthesis", END);
    
    OldSubgraph.subgraph = builder.compile();
    return OldSubgraph.subgraph;
  }
  
  static async execute(input: unknown, config: Record<string, any>) {
    // 30+ lines of execution logic, error handling, logging...
  }
}
```

### After (6 lines)
```typescript
export const NewSubgraph = SubgraphBuilder
  .create("NewSubgraph")
  .start(ResearchAgent)
  .then(AnalysisAgent)
  .then(SynthesisAgent)
  .build();
```

## Best Practices

### 1. Descriptive Names
```typescript
// Good
const DataProcessingPipeline = SubgraphBuilder.create("DataProcessingPipeline")

// Avoid
const Subgraph1 = SubgraphBuilder.create("Subgraph1")
```

### 2. Logical Grouping
Group related agents into cohesive subgraphs:
```typescript
// Content creation pipeline
const ContentPipeline = SubgraphBuilder
  .create("ContentPipeline")
  .start(ResearchAgent)
  .then(WritingAgent)
  .then(EditingAgent)
  .then(ReviewAgent)
  .build();

// Analysis pipeline  
const AnalysisPipeline = SubgraphBuilder
  .create("AnalysisPipeline")
  .start(DataCollectionAgent)
  .then(StatisticalAnalysisAgent)
  .then(ReportGenerationAgent)
  .build();
```

### 3. Error Strategy Selection
- Use `"fallback"` for non-critical operations
- Use `"fail-fast"` for critical validation steps
- Use `"retry"` for network-dependent operations

### 4. Configuration Management
```typescript
const config = {
  errorStrategy: "fallback" as const,
  timeout: 30000,
  retries: 2
};

const subgraph = SubgraphBuilder
  .create("ConfiguredSubgraph")
  .start(Agent1)
  .then(Agent2, { temperature: 0.1 })
  .withConfig(config)
  .build();
```

## Troubleshooting

### Common Issues

1. **"Must call start() before then()"**
   - Always call `.start()` before any other agent methods

2. **"Cannot read properties of undefined (reading 'errorStrategy')"**
   - This error has been fixed with automatic context binding
   - If you encounter this, ensure you're using the latest version
   - The `execute` method is automatically bound to preserve context

3. **Conditional routing not working**
   - Ensure condition functions return string values matching case keys
   - Provide a `default` case for unexpected values

4. **Agent not found errors**
   - Verify all agents extend `BaseAgent`
   - Check import paths

5. **Context loss when used with ReactAgentBuilder**
   - Fixed: Context is automatically preserved through method binding
   - No additional steps needed for integration

### Debugging
Enable debug logging by setting a custom session ID:
```typescript
const subgraph = SubgraphBuilder
  .create("DebugSubgraph")
  .start(Agent1)
  .withConfig({ sessionId: "debug-session-123" })
  .build();
```

### Context Binding (Technical Details)
The SubgraphBuilder automatically handles context binding to prevent common execution errors:
- `execute` method is bound in the constructor
- Config fallbacks are implemented throughout
- State validation prevents undefined property access
- Compatible with all LangGraph callback contexts

### Success Indicators
When SubgraphBuilder is working correctly, you should see:
```
✅ ActionSubgraph: Starting execution
✅ ActionSubgraph: Execution completed
✅ Conclusion length: [positive number] chars
✅ Action results: [positive number] items
```

If you see these log messages without errors, the integration is successful.

## Examples

### Working Test Case
Based on successful production usage:
```typescript
// This example works perfectly with ReactAgentBuilder
import { SubgraphBuilder } from "../SubgraphBuilder";
import { ResearchAgent, AnalysisAgent, SynthesisAgent } from "./subgraphAgents";

export const ActionSubgraph = SubgraphBuilder
  .create("ActionSubgraph")
  .start(ResearchAgent)
  .then(AnalysisAgent, { temperature: 0.2, maxTokens: 1000 })
  .then(SynthesisAgent)
  .withConfig({
    errorStrategy: "fallback",
    timeout: 30000,
    retries: 2
  })
  .build();

// Integration with ReactAgentBuilder (Tested ✅)
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_API_KEY,
  openaiKey: process.env.OPENAI_API_KEY
}).replaceActionNode(ActionSubgraph);

// Usage (Tested ✅)
const result = await agent.invoke({
  objective: "Analyze the benefits and challenges of remote work for software development teams",
  outputInstruction: "Structured analysis with pros, cons, and recommendations"
});
```

### Complete File Examples
See `/src/core/example/` for complete examples:
- `simplifiedSubgraphAction.ts` - Basic usage patterns ✅
- `fixedUsageExample.ts` - Context binding fix examples ✅  
- `subgraphAgents.ts` - Example agent implementations ✅
