# Session Memory Feature

The DelReact framework now supports stateful agent memory for session continuity. This feature allows agents to recall previous conclusions and conversation histories between invocations using the same `sessionId`, enabling context continuity similar to a chatbot with persistent memory.

## Overview

Session memory enables agents to:
- Remember previous conclusions and key conversation histories
- Maintain context continuity across multiple `invoke()` calls with the same `sessionId`
- Automatically include relevant memory context in agent prompts
- Store session data in-memory or persist to SQLite for durability

## Configuration

### Basic In-Memory Session Memory

```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  memory: "in-memory", // Enables session memory
  useEnhancedPrompt: true
})
.init({ selectedProvider: 'gemini', model: 'gemini-2.5-flash' })
.build();
```

### SQLite Persistent Session Memory

```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  memory: "in-memory", // Base memory type
  enableSessionPersistence: true, // Enables SQLite persistence
  useEnhancedPrompt: true
})
.init({ selectedProvider: 'gemini', model: 'gemini-2.5-flash' })
.build();
```

## Usage Examples

### Basic Session Continuity

```typescript
// First conversation
const result1 = await agent.invoke({
  objective: "My name is Alice and I work as a software engineer.",
  sessionId: "user-session-123"
});

// Second conversation - agent will remember Alice and her profession
const result2 = await agent.invoke({
  objective: "What programming languages would you recommend for me?",
  sessionId: "user-session-123" // Same session ID
});

// The agent will use context from the first conversation to provide
// personalized recommendations for a software engineer named Alice
```

### Building Context Over Multiple Interactions

```typescript
const sessionId = "learning-session-456";

// Step 1: Share interests
await agent.invoke({
  objective: "I'm interested in machine learning and data science.",
  sessionId
});

// Step 2: Ask for resources (remembers interests)
await agent.invoke({
  objective: "What are the best resources to get started?",
  sessionId
});

// Step 3: Get specific recommendations (remembers context)
await agent.invoke({
  objective: "Which Python libraries should I learn first?",
  sessionId
});
```

### Session Isolation

```typescript
// Different session IDs maintain separate memory contexts
const aliceSession = "alice-session";
const bobSession = "bob-session";

// Alice's context
await agent.invoke({
  objective: "I'm a frontend developer working with React.",
  sessionId: aliceSession
});

// Bob's context (completely separate)
await agent.invoke({
  objective: "I'm a backend developer using Python.",
  sessionId: bobSession
});

// Each session maintains its own memory and context
```

## Memory Storage Options

### In-Memory Storage (Default)
- Fast and lightweight
- Session data lost when application restarts
- Good for temporary sessions and development

```typescript
memory: "in-memory",
enableSessionPersistence: false // Default
```

### SQLite Persistence
- Session data persists across application restarts
- Stored in `.delreact-memory/sessions.json`
- Automatic file-based storage management

```typescript
memory: "in-memory",
enableSessionPersistence: true // Forces SQLite for sessions
```

### Custom SQLite Directory
```typescript
memory: "sqlite", // Direct SQLite usage
// Custom path will be used: .delreact-memory/
```

## Session Memory Structure

Each session contains:

```typescript
interface SessionMemory {
  sessionId: string;
  previousConclusions: string[]; // Last 5 conclusions
  conversationHistory: Array<{
    objective: string;
    conclusion: string;
    timestamp: number;
    keyResults?: string[];
  }>; // Last 10 conversations
  lastUpdated: number;
}
```

## How Session Context Works

1. **Automatic Context Injection**: The framework automatically includes relevant session context in agent prompts
2. **Smart Summarization**: Previous conversations are summarized to prevent context overflow
3. **Efficient Storage**: Only key information is retained (last 5 conclusions, last 10 conversations)
4. **Context Relevance**: Recent interactions are weighted more heavily in context generation

### Example Context Injection

```
## Session Memory Context
Based on our previous conversations:

**Previous Objective (2 minutes ago)**: My name is Alice and I work as a software engineer.
**Result**: I've noted that you're Alice, a software engineer. I'm ready to help with any technical questions...

**Previous Objective (1 minute ago)**: What programming languages would you recommend for me?
**Result**: For a software engineer like you, Alice, I'd recommend focusing on modern languages like...

Please consider this context when working on the current objective.
```

## Best Practices

### Session ID Management
- Use consistent session IDs for user sessions (e.g., user ID or session token)
- Generate unique session IDs for different conversation contexts
- Consider session expiration for long-running applications

### Memory Optimization
- Session memory automatically limits stored data to prevent overflow
- Recent conversations are prioritized in context generation
- Use descriptive objectives to improve context relevance

### Persistence Considerations
- Enable SQLite persistence for production applications
- In-memory storage is sufficient for development and testing
- Session files are stored in `.delreact-memory/` directory

## Advanced Configuration

### Custom Memory Retention
The framework automatically manages memory retention, but you can understand the defaults:
- **Previous Conclusions**: Last 5 conclusions kept
- **Conversation History**: Last 10 conversations kept
- **Context Generation**: Last 3 conversations used for context

### Session Memory Lifecycle
1. **Session Creation**: New session created when sessionId first used
2. **Context Loading**: Previous session context loaded on each invoke
3. **Context Injection**: Relevant context added to agent prompts
4. **Result Storage**: New conversation added to session memory
5. **Cleanup**: Old conversations automatically pruned

## API Reference

### ReactAgentConfig
```typescript
interface ReactAgentConfig {
  memory?: "in-memory" | "postgres" | "redis" | "sqlite";
  enableSessionPersistence?: boolean; // Enable SQLite persistence
  // ... other config options
}
```

### AgentRequest
```typescript
interface AgentRequest {
  objective: string;
  sessionId?: string; // Optional session ID for memory continuity
  // ... other request options
}
```

### AgentResponse
```typescript
interface AgentResponse {
  conclusion: string;
  sessionId: string; // Session ID used (generated if not provided)
  fullState: AgentState;
  // ... other response fields
}
```

## Migration Guide

### From Non-Memory to Memory-Enabled

**Before:**
```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY
}).init({ selectedProvider: 'gemini' }).build();

const result = await agent.invoke({
  objective: "Help me with coding"
});
```

**After:**
```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  memory: "in-memory", // Add memory support
  enableSessionPersistence: true // Optional: enable persistence
}).init({ selectedProvider: 'gemini' }).build();

const result = await agent.invoke({
  objective: "Help me with coding",
  sessionId: "user-123" // Add session ID for continuity
});
```

## Troubleshooting

### Common Issues

**Session memory not working:**
- Ensure `memory` is configured in ReactAgentConfig
- Verify `sessionId` is provided and consistent across calls
- Check that memory initialization succeeded (no error logs)

**SQLite persistence not working:**
- Ensure `enableSessionPersistence: true` is set
- Check file permissions for `.delreact-memory/` directory
- Verify disk space is available

**Context not appearing in responses:**
- Session memory is injected into agent prompts, not directly visible in responses
- Agents use context to inform their responses rather than explicitly mentioning it
- Enable debug logging to see context injection

### Debug Information

Enable debug logging to see session memory operations:
```
🧠 Memory initialized: in-memory
🧠 Session memory loaded for: user-session-123
🔄 Updated session memory for: user-session-123
💾 Session memory updated for: user-session-123
```

## Security Considerations

- Session data may contain sensitive user information
- `.delreact-memory/` directory should be excluded from version control (included in `.gitignore`)
- Consider implementing session expiration for long-running applications
- Use secure session ID generation in production environments