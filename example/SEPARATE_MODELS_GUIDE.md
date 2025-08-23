# Separate Model Configuration Feature

## Overview

This feature allows ReactAgentBuilder to use different models for different types of agents:

- **Reasoning Agents**: TaskBreakdownAgent, TaskReplanningAgent, EnhancePromptAgent
- **Execution Agents**: ActionAgent, CompletionAgent

This enables cost optimization and performance tuning by using appropriate models for different tasks.

## Configuration Options

### Basic Separate Model Configuration

```typescript
const agent = builder.init({
  // Fast reasoning for planning
  reasonProvider: "gemini",
  reasonModel: "gemini-2.0-flash",
  
  // High-quality execution for final outputs
  selectedProvider: "openai",
  model: "gpt-4o-mini"
}).build();
```

### Backward Compatible (Unchanged)

```typescript
const agent = builder.init({
  selectedProvider: "gemini",
  model: "gemini-2.0-flash"  // All agents use this model
}).build();
```

### Same Provider, Different Models

```typescript
const agent = builder.init({
  reasonProvider: "openai",
  reasonModel: "gpt-4o-mini",     // Fast reasoning
  selectedProvider: "openai",
  model: "gpt-4o"                 // High-quality execution
}).build();
```

## Parameters

| Parameter | Description | Agent Type | Default |
|-----------|-------------|------------|---------|
| `reasonProvider` | Provider for reasoning agents | TaskBreakdown, TaskReplanning, EnhancePrompt | `selectedProvider` or `openai` |
| `reasonModel` | Model for reasoning agents | TaskBreakdown, TaskReplanning, EnhancePrompt | `model` or `gpt-4o-mini` |
| `selectedProvider` | Provider for execution agents | Action, Completion | First available provider |
| `model` | Model for execution agents | Action, Completion | `gpt-4o-mini` |

## Agent Classification

### Reasoning Agents (use `reasonProvider`/`reasonModel`)
- **TaskBreakdownAgent**: Breaks down objectives into actionable tasks
- **TaskReplanningAgent**: Evaluates progress and replans if needed  
- **EnhancePromptAgent**: Enhances user prompts for clarity (when enabled)

### Execution Agents (use `selectedProvider`/`model`)
- **ActionAgent**: Executes individual tasks using tools
- **CompletionAgent**: Synthesizes results and provides final conclusion

## Validation and Warnings

The system provides helpful warnings for common misconfigurations:

```typescript
// Warning: reasonModel specified but reasonProvider is missing
{
  reasonModel: "gpt-4o-mini",    // ⚠️ Warning triggered
  selectedProvider: "openai",
  model: "gpt-4o-mini"
}

// Warning: reasonProvider specified but reasonModel is missing  
{
  reasonProvider: "openai",      // ⚠️ Warning triggered
  selectedProvider: "gemini",
  model: "gemini-2.0-flash"
}

// Warning: No API key for provider
{
  reasonProvider: "openai",      // ⚠️ Warning if openaiKey missing
  reasonModel: "gpt-4o-mini",
  selectedProvider: "gemini", 
  model: "gemini-2.0-flash"
}
```

## Use Cases

### 1. Cost Optimization
Use faster, cheaper models for planning and more capable models for execution:

```typescript
const agent = builder.init({
  reasonProvider: "gemini",        // Fast and cost-effective
  reasonModel: "gemini-2.0-flash",
  selectedProvider: "openai",     // Higher quality
  model: "gpt-4o-mini"
}).build();
```

### 2. Provider Specialization
Leverage different providers' strengths:

```typescript
const agent = builder.init({
  reasonProvider: "gemini",        // Google's strength in reasoning
  reasonModel: "gemini-2.0-flash",
  selectedProvider: "anthropic",   // Anthropic's strength in execution
  model: "claude-3-sonnet"
}).build();
```

### 3. Development vs Production
Different models for different environments:

```typescript
// Development: Fast models for quick iteration
const devAgent = builder.init({
  reasonProvider: "gemini",
  reasonModel: "gemini-2.0-flash",
  selectedProvider: "openai",
  model: "gpt-4o-mini"
}).build();

// Production: High-quality models for best results
const prodAgent = builder.init({
  reasonProvider: "openai",
  reasonModel: "gpt-4o",
  selectedProvider: "openai", 
  model: "gpt-4o"
}).build();
```

## Default Behavior

When configuration is incomplete, the system uses intelligent defaults:

1. If only `selectedProvider`/`model` specified → All agents use execution config (backward compatible)
2. If only `reasonProvider`/`reasonModel` specified → Execution agents use default
3. If no models specified → All agents use `gpt-4o-mini`
4. If no providers specified → All agents use first available provider

## Benefits

- **Cost Efficiency**: Optimize costs by using appropriate models for different tasks
- **Performance Tuning**: Fine-tune performance based on agent responsibilities  
- **Provider Flexibility**: Mix and match providers based on their strengths
- **Zero Breaking Changes**: Existing configurations continue to work unchanged
- **Smart Validation**: Prevents common misconfigurations with helpful warnings
- **Intelligent Defaults**: Sensible fallbacks when configuration is incomplete

## Migration Guide

### Existing Code (No Changes Required)
```typescript
// This continues to work exactly as before
const agent = builder.init({
  selectedProvider: "gemini",
  model: "gemini-2.0-flash"
}).build();
```

### Enhanced with Separate Models
```typescript
// Add reasoning configuration for optimization
const agent = builder.init({
  reasonProvider: "gemini",        // New: Fast reasoning
  reasonModel: "gemini-2.0-flash", // New: Fast reasoning
  selectedProvider: "openai",      // Existing: Execution
  model: "gpt-4o-mini"            // Existing: Execution  
}).build();
```

The feature is fully backward compatible - no existing code needs to change.