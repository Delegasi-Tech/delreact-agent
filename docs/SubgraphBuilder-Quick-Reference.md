# SubgraphBuilder Quick Reference

## Basic Pattern
```typescript
import { SubgraphBuilder } from "../SubgraphBuilder";

const MySubgraph = SubgraphBuilder
  .create("MySubgraph")
  .start(FirstAgent)
  .then(SecondAgent)
  .then(ThirdAgent)
  .build();

// Usage
const result = await MySubgraph.execute(state, config);
```

## API Cheat Sheet

| Method | Purpose | Example |
|--------|---------|---------|
| `.create(name)` | Initialize builder | `.create("ProcessingPipeline")` |
| `.start(agent, config?)` | Set first agent | `.start(ResearchAgent)` |
| `.then(agent, config?)` | Add next agent | `.then(AnalysisAgent, { temp: 0.2 })` |
| `.branch(config)` | Boolean routing | `.branch({ condition: (s) => s.valid, ifTrue: A, ifFalse: B })` |
| `.switch(config)` | Multi-way routing | `.switch({ condition: (s) => s.type, cases: {...} })` |
| `.withConfig(config)` | Global settings | `.withConfig({ errorStrategy: "retry" })` |
| `.build()` | Compile subgraph | `.build()` |

## Configuration Options

### SubgraphConfig
```typescript
{
  errorStrategy: "fallback" | "fail-fast" | "retry",
  timeout: 30000,      // milliseconds
  retries: 2,          // number of retry attempts
  sessionId: "custom"  // session identifier
}
```

### AgentNodeConfig
```typescript
{
  temperature: 0.2,    // LLM temperature
  maxTokens: 1000,     // token limit
  timeout: 15000       // agent timeout
}
```

## Conditional Routing

### Branch (2-way)
```typescript
.branch({
  condition: (state) => state.isValid,
  ifTrue: ProcessAgent,
  ifFalse: ErrorAgent
})
```

### Switch (N-way)
```typescript
.switch({
  condition: (state) => state.taskType,
  cases: {
    "research": ResearchAgent,
    "analysis": AnalysisAgent,
    "synthesis": SynthesisAgent
  },
  default: GeneralAgent
})
```

## Error Strategies

| Strategy | Behavior | When to Use |
|----------|----------|-------------|
| `fallback` | Log error, continue with fallback response | Non-critical operations |
| `fail-fast` | Throw error immediately | Critical validation |
| `retry` | Retry with exponential backoff | Network operations |

## Migration Pattern

### From Manual StateGraph
```typescript
// OLD (80+ lines)
export class OldSubgraph {
  private static subgraph: any = null;
  static createSubgraph() { /* ... */ }
  static async execute() { /* ... */ }
}

// NEW (6 lines)
export const NewSubgraph = SubgraphBuilder
  .create("NewSubgraph")
  .start(Agent1).then(Agent2).then(Agent3)
  .build();
```

## Common Patterns

### Linear Pipeline
```typescript
const Pipeline = SubgraphBuilder
  .create("Pipeline")
  .start(InputAgent)
  .then(ProcessAgent)
  .then(OutputAgent)
  .build();
```

### Validation + Processing
```typescript
const ValidatedProcessing = SubgraphBuilder
  .create("ValidatedProcessing")
  .start(ValidateAgent)
  .branch({
    condition: (state) => state.isValid,
    ifTrue: ProcessAgent,
    ifFalse: ErrorHandlerAgent
  })
  .build();
```

### Type-based Routing
```typescript
const TypeRouter = SubgraphBuilder
  .create("TypeRouter")
  .start(ClassifyAgent)
  .switch({
    condition: (state) => state.documentType,
    cases: {
      "pdf": PDFProcessor,
      "image": ImageProcessor,
      "text": TextProcessor
    },
    default: GenericProcessor
  })
  .build();
```

## Integration Examples

### With ReactAgentBuilder
```typescript
const reactAgent = new ReactAgentBuilder(config)
  .replaceActionNode(MySubgraph)
  .buildGraph();
```

### With Custom Agents
```typescript
class MyCustomAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>) {
    // Custom logic
    return partialState;
  }
}

const subgraph = SubgraphBuilder
  .create("Custom")
  .start(MyCustomAgent)
  .build();
```

## Debugging Tips

1. **Add session IDs for tracking**:
   ```typescript
   .withConfig({ sessionId: "debug-123" })
   ```

2. **Use descriptive names**:
   ```typescript
   .create("UserRegistrationPipeline") // Good
   .create("Subgraph1")                // Bad
   ```

3. **Test conditions separately**:
   ```typescript
   const testCondition = (state) => {
     console.log("Condition input:", state);
     const result = state.isValid;
     console.log("Condition result:", result);
     return result;
   };
   ```

4. **Check agent imports**:
   ```typescript
   import { ResearchAgent } from "./subgraphAgents";
   console.log("Agent loaded:", ResearchAgent.name);
   ```

5. **Context binding issues (Fixed)**:
   - Context is automatically preserved - no manual binding needed
   - Safe to use with `ReactAgentBuilder.replaceActionNode()`
   - Built-in fallbacks prevent undefined property errors

## Known Fixed Issues

- ✅ **Context Loss**: `execute` method automatically bound in constructor
- ✅ **Undefined Config**: Safe fallbacks implemented throughout
- ✅ **State Validation**: Defensive checks for all state properties
- ✅ **ReactAgentBuilder Integration**: Full compatibility maintained
