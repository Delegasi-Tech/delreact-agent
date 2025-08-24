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
- Default storage location: `.delreact-memory/sessions.json`
- Custom storage location: Configure with `customMemoryPath` option
- Automatic file-based storage management

```typescript
// Default location
memory: "in-memory",
enableSessionPersistence: true // Uses .delreact-memory/

// Custom location  
memory: "in-memory",
enableSessionPersistence: true,
customMemoryPath: "/my/custom/path" // Uses /my/custom/path/
```

### PostgreSQL Storage (Available)
- Full database persistence with ACID compliance
- Scalable for high-volume applications  
- Automatic schema initialization and management
- **Note**: PostgreSQL storage is fully implemented but not yet integrated into the memory configuration system

```typescript
// PostgreSQL will be available in future releases as:
// memory: "postgres",
// connectionString: "postgresql://user:pass@localhost:5432/delreact"
```

### Custom SQLite Directory
```typescript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  memory: "sqlite", // Direct SQLite usage
  customMemoryPath: "/path/to/custom/memory", // Custom directory path
  enableSessionPersistence: true
})
.init({ selectedProvider: 'gemini', model: 'gemini-2.5-flash' })
.build();

// Or with in-memory base but custom SQLite persistence:
const agent2 = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  memory: "in-memory", // Base memory type
  enableSessionPersistence: true, // Forces SQLite for sessions
  customMemoryPath: "/custom/session/storage" // Custom path for session storage
})
.init({ selectedProvider: 'gemini', model: 'gemini-2.5-flash' })
.build();
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
  customMemoryPath?: string; // Custom directory path for SQLite storage
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

## Context Condensation Strategies for Long Conversations

As conversations grow longer, managing context efficiently becomes crucial to prevent token limit overflow and maintain response quality. DelReact implements several strategies to handle long conversation histories while preserving the most relevant information.

### Current Implementation

DelReact currently uses a **Fixed Window Approach** with the following defaults:
- **Previous Conclusions**: Last 5 conclusions retained
- **Conversation History**: Last 10 conversations retained  
- **Context Generation**: Last 3 conversations used for prompt context
- **Text Truncation**: Individual results limited to 200 characters for context

### Advanced Condensation Strategies

When conversations exceed current limits, consider these strategies for future enhancements:

#### 1. Sliding Window with Importance Scoring

**Concept**: Retain conversations based on importance scores rather than just recency.

```typescript
interface ConversationEntry {
  objective: string;
  conclusion: string;
  timestamp: number;
  keyResults?: string[];
  importanceScore?: number; // 0-100 based on various factors
}

// Scoring factors:
// - User engagement (follow-up questions)
// - Task complexity (number of tools used)
// - Outcome success (task completion)
// - Reference frequency (how often later conversations reference this)
```

**Implementation Approach**:
- Score conversations based on user engagement, task complexity, and outcome success
- Retain high-scoring conversations even if they're older
- Gradually decay importance scores over time
- Keep a mix of recent and important historical conversations

#### 2. Semantic Clustering and Summarization

**Concept**: Group related conversations by topic and create summaries for each cluster.

```typescript
interface ConversationCluster {
  theme: string; // e.g., "Python Learning", "Project Setup", "Debugging"
  conversations: ConversationEntry[];
  summary: string; // LLM-generated summary of the cluster
  lastUpdated: number;
}

interface CondensedSessionMemory extends SessionMemory {
  conversationClusters: ConversationCluster[];
  recentConversations: ConversationEntry[]; // Last 3-5 conversations
}
```

**Implementation Approach**:
- Use embedding similarity to group related conversations
- Generate cluster summaries using LLM with focused prompts
- Maintain detailed recent conversations + condensed historical themes
- Update cluster summaries when new related conversations are added

#### 3. Hierarchical Memory Structure

**Concept**: Organize memory in layers from immediate to long-term context.

```typescript
interface HierarchicalMemory {
  immediate: ConversationEntry[]; // Last 2-3 conversations (full detail)
  shortTerm: ConversationSummary[]; // Last 10 conversations (summarized)
  longTerm: ThematicSummary[]; // Older conversations grouped by theme
  userProfile: UserContext; // Persistent user information
}

interface ConversationSummary {
  timeframe: string; // "2 hours ago", "yesterday"
  objectives: string[]; // List of main objectives
  outcomes: string[]; // Key outcomes achieved
  topics: string[]; // Main topics discussed
}

interface ThematicSummary {
  theme: string;
  period: string; // "Last week", "This month"
  keyLearnings: string[];
  progressMade: string[];
  currentStatus: string;
}
```

**Implementation Approach**:
- Maintain full detail for immediate context (2-3 conversations)
- Progressively summarize older conversations into different time/topic buckets
- Extract persistent user context (preferences, expertise level, ongoing projects)
- Generate context dynamically based on current conversation relevance

#### 4. Dynamic Context Selection

**Concept**: Intelligently select which historical context to include based on current conversation.

```typescript
interface ContextSelector {
  selectRelevantContext(
    currentObjective: string,
    sessionMemory: SessionMemory,
    maxTokens: number
  ): {
    selectedConversations: ConversationEntry[];
    reasoning: string;
    contextSummary: string;
  };
}

// Selection strategies:
// - Keyword matching between current and past objectives
// - Semantic similarity using embeddings
// - Topic continuity (ongoing projects/themes)
// - Temporal relevance (recent + milestone conversations)
```

**Implementation Approach**:
- Use natural language processing to extract key topics from current objective
- Match against historical conversation topics and outcomes
- Prioritize context that's directly relevant to current task
- Include milestone conversations that established important context

#### 5. Adaptive Compression Levels

**Concept**: Adjust compression based on conversation patterns and user behavior.

```typescript
interface AdaptiveCompression {
  userEngagementLevel: 'low' | 'medium' | 'high';
  conversationComplexity: 'simple' | 'moderate' | 'complex';
  topicContinuity: boolean;
  compressionStrategy: 'aggressive' | 'balanced' | 'conservative';
}

// Compression rules:
// - High engagement + complex topics = conservative compression
// - Low engagement + simple topics = aggressive compression  
// - Topic continuity = preserve related conversations
// - New topic = more aggressive historical compression
```

### Implementation Roadmap

#### Phase 1: Enhanced Current System
- Add importance scoring to current fixed window approach
- Implement configurable window sizes
- Add topic extraction from conversations

#### Phase 2: Semantic Grouping
- Integrate embedding models for conversation similarity
- Implement conversation clustering by topic
- Generate cluster summaries using LLM

#### Phase 3: Hierarchical Memory
- Implement multi-layered memory structure
- Add user profile extraction and maintenance
- Develop dynamic context selection algorithms

#### Phase 4: Adaptive Intelligence
- Add conversation pattern analysis
- Implement adaptive compression strategies
- Develop predictive context relevance scoring

### Configuration Options (Future)

```typescript
interface AdvancedMemoryConfig {
  strategy: 'fixed' | 'importance' | 'semantic' | 'hierarchical' | 'adaptive';
  maxConversations: number;
  maxTokensForContext: number;
  compressionLevel: 'conservative' | 'balanced' | 'aggressive';
  enableSemanticClustering: boolean;
  enableUserProfiling: boolean;
  importanceFactors: {
    recency: number; // 0-1 weight
    complexity: number; // 0-1 weight
    engagement: number; // 0-1 weight
    continuity: number; // 0-1 weight
  };
}
```

### Best Practices for Long Conversations

#### For Users:
1. **Use Descriptive Objectives**: Clear, specific objectives help with context matching
2. **Reference Previous Work**: Explicitly mention when building on previous conversations
3. **Break Complex Tasks**: Split large projects into focused conversation sessions
4. **Provide Context Cues**: Mention relevant background when switching topics

#### For Developers:
1. **Monitor Context Size**: Track token usage for context generation
2. **Test Edge Cases**: Verify behavior with very long conversation histories
3. **User Feedback**: Allow users to indicate which conversations are most important
4. **Performance Monitoring**: Track response times as context grows

### Research References

The strategies above are based on established techniques in conversational AI and memory management:

- **Sliding Windows**: Common in streaming data processing and neural networks
- **Semantic Clustering**: Used in document summarization and topic modeling
- **Hierarchical Memory**: Inspired by human memory systems (working, short-term, long-term)
- **Importance Scoring**: Adapted from information retrieval ranking algorithms
- **Dynamic Selection**: Based on attention mechanisms in transformer models

### Future Research Directions

1. **Personalized Compression**: Learning individual user's conversation patterns
2. **Cross-Session Learning**: Identifying patterns across multiple user sessions
3. **Emotional Context**: Preserving conversations with high emotional significance
4. **Tool Usage Patterns**: Prioritizing conversations that led to successful tool usage
5. **Collaborative Memory**: Sharing relevant context patterns across similar user types