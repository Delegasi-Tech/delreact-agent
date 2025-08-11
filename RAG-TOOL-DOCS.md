# DelReact RAG Tool 🧠

The RAG (Retrieval-Augmented Generation) tool enables DelReact agents to ingest, store, and search knowledge using vector embeddings for enhanced reasoning and information retrieval.

## Features

- **Knowledge Ingestion**: Store text documents with metadata
- **Vector Embeddings**: Optional OpenAI embeddings for semantic search
- **Text Search**: Fallback keyword-based search functionality
- **CRUD Operations**: Add, search, list, delete, and clear knowledge
- **Web Interface**: Browser-based knowledge management interface
- **Session Persistence**: Knowledge persists across agent sessions

## Quick Start

### 1. Using the RAG Tool in Code

```javascript
import { ReactAgentBuilder, ragToolDef } from 'delreact-agent';

// Add knowledge directly
const result = await ragToolDef.invoke({
  action: "add",
  content: "DelReact is a powerful agent framework...",
  metadata: { source: "documentation", category: "framework" },
  agentConfig: { openaiKey: process.env.OPENAI_KEY } // optional for embeddings
});

// Search knowledge
const searchResult = await ragToolDef.invoke({
  action: "search",
  query: "DelReact framework",
  limit: 5
});
```

### 2. Using with DelReact Agents

```javascript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY
})
.init({ selectedProvider: 'gemini' })
.build();

const result = await agent.invoke({
  objective: "Add knowledge about DelReact using the RAG tool",
  prompt: "Use the rag-knowledge tool to add information about DelReact framework capabilities."
});
```

### 3. Web Interface

Start the web server to manage knowledge through a browser interface:

```bash
node rag-server.js
```

Then open http://localhost:3000 in your browser.

## API Reference

### Actions

#### `add` - Add Knowledge
```javascript
{
  action: "add",
  content: "Knowledge content here",
  metadata: { source: "docs", category: "technical" }, // optional
  id: "custom-id", // optional, auto-generated if not provided
  agentConfig: { openaiKey: "sk-..." } // optional for embeddings
}
```

#### `search` - Search Knowledge
```javascript
{
  action: "search",
  query: "search terms",
  limit: 5, // optional, default 5
  agentConfig: { openaiKey: "sk-..." } // optional for semantic search
}
```

#### `list` - List All Knowledge
```javascript
{
  action: "list"
}
```

#### `delete` - Delete Knowledge
```javascript
{
  action: "delete",
  id: "knowledge-id"
}
```

#### `clear` - Clear All Knowledge
```javascript
{
  action: "clear"
}
```

## Configuration

### OpenAI Integration (Optional)
To enable semantic search with vector embeddings, provide an OpenAI API key:

```javascript
const config = {
  agentConfig: {
    openaiKey: process.env.OPENAI_KEY
  }
};
```

**Without OpenAI key**: The tool falls back to text-based search using keyword matching.

**With OpenAI key**: Enables semantic search using vector embeddings for more intelligent retrieval.

## Storage

The RAG tool uses an in-memory singleton storage by default, which means:
- Knowledge persists during the application session
- Knowledge is lost when the application restarts
- All tool calls share the same knowledge base

For production use, consider integrating with DelReact's memory backends (PostgreSQL, Redis) for persistent storage.

## Integration with Agents

The RAG tool is automatically registered in the DelReact tool registry and is available to all agents. Agents can:

1. **Add domain knowledge** before processing tasks
2. **Search for relevant information** during reasoning
3. **Build persistent knowledge bases** across sessions
4. **Enhance responses** with contextual information

## Examples

### Building a Knowledge Base
```javascript
// Add multiple knowledge items
await ragToolDef.invoke({
  action: "add",
  content: "React is a JavaScript library for building user interfaces.",
  metadata: { source: "React docs", category: "frontend" }
});

await ragToolDef.invoke({
  action: "add", 
  content: "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
  metadata: { source: "Node.js docs", category: "backend" }
});
```

### Intelligent Search
```javascript
// Search finds relevant items even with different wording
const results = await ragToolDef.invoke({
  action: "search",
  query: "user interface library",
  agentConfig: { openaiKey: process.env.OPENAI_KEY }
});
// Returns React documentation due to semantic similarity
```

### Agent Integration
```javascript
const agent = new ReactAgentBuilder(config).build();

// Agent can use RAG tool automatically
const response = await agent.invoke({
  objective: "Explain the differences between React and Node.js",
  prompt: "Search our knowledge base for information about React and Node.js, then explain their differences."
});
```

## Web Interface Features

The included web interface (`rag-web-interface.html`) provides:

- 📝 **Add Knowledge**: Forms for adding content with metadata
- 🔍 **Search Interface**: Query knowledge with configurable results
- 📊 **Statistics**: Real-time stats on knowledge base size
- 🗂️ **Knowledge Management**: View, delete, and manage items
- 🧠 **Embedding Status**: Shows which items have vector embeddings
- 🎨 **Modern UI**: Responsive design with status notifications

## Testing

Run the included test suite:

```bash
node test-rag.js
```

This tests all RAG functionality including add, search, list, delete, and clear operations.

## Error Handling

The RAG tool provides comprehensive error handling:

- **Invalid actions**: Clear error messages for unsupported operations
- **Missing parameters**: Validation for required fields
- **OpenAI failures**: Graceful fallback to text search
- **Storage errors**: Proper error propagation and logging

## Performance Notes

- **In-memory storage**: Fast but limited by available RAM
- **Vector search**: O(n) complexity for similarity calculations
- **Text search**: Optimized term matching with early filtering
- **Singleton pattern**: Ensures consistent storage across tool calls

For large knowledge bases (>10,000 items), consider implementing:
- Database-backed storage
- Vector database integration (Pinecone, Weaviate, etc.)
- Pagination for large result sets
- Caching strategies

## Roadmap

Future enhancements may include:
- Database persistence integration
- Multiple embedding providers
- Advanced search filters
- Knowledge versioning
- Import/export functionality
- Batch operations