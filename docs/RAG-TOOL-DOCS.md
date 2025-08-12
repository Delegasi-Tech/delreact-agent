# DelReact RAG Tool 🧠

The RAG (Retrieval-Augmented Generation) tool enables DelReact agents to ingest, store, and search knowledge using vector embeddings for enhanced reasoning and information retrieval.

## Features

- **Knowledge Ingestion**: Store text documents with metadata
- **File Loading**: Load knowledge from JSON, PDF, and text files
- **Bulk Operations**: Batch load multiple items with optional embeddings  
- **Vector Embeddings**: Optional OpenAI embeddings for semantic search
- **Text Search**: Fallback keyword-based search functionality
- **CRUD Operations**: Add, search, list, delete, and clear knowledge
- **Export & Persistence**: Export knowledge to JSON, Buffer, or filesystem
- **Web Interface**: Browser-based knowledge management interface
- **Session Persistence**: Knowledge persists across agent sessions
- **ReactAgentBuilder Integration**: Initialize knowledge during agent setup

## Quick Start

### 1. Initialize ReactAgentBuilder with Knowledge

```javascript
import { ReactAgentBuilder } from 'delreact-agent';

const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  // Load knowledge files during initialization
  knowledgeFiles: [
    './docs/framework-knowledge.json',
    './data/user-manual.pdf'
  ],
  // Add initial knowledge items
  initialKnowledge: [
    {
      content: "DelReact supports multiple LLM providers",
      metadata: { source: "config", category: "features" }
    }
  ]
})
.init({ selectedProvider: 'gemini' })
.build();
```

### 2. Using the RAG Tool in Code

```javascript
import { ragToolDef } from 'delreact-agent';

// Add knowledge directly
const result = await ragToolDef.invoke({
  action: "add",
  content: "DelReact is a powerful agent framework...",
  metadata: { source: "documentation", category: "framework" },
  agentConfig: { openaiKey: process.env.OPENAI_KEY } // optional for embeddings
});

// Load from file
const fileResult = await ragToolDef.invoke({
  action: "loadFile",
  filePath: "./knowledge-base.json",
  agentConfig: { openaiKey: process.env.OPENAI_KEY }
});

// Bulk load with embeddings
const bulkResult = await ragToolDef.invoke({
  action: "loadBulk",
  items: [
    {
      content: "AI content 1",
      metadata: { category: "ai" },
      embedding: [0.1, 0.2, 0.3] // pre-computed embedding
    },
    {
      content: "AI content 2", 
      metadata: { category: "ai" }
      // embedding will be generated if OpenAI key provided
    }
  ],
  agentConfig: { openaiKey: process.env.OPENAI_KEY }
});

// Search knowledge
const searchResult = await ragToolDef.invoke({
  action: "search",
  query: "DelReact framework",
  limit: 5
});
```

### 3. Using with DelReact Agents

```javascript
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY
})
.init({ selectedProvider: 'gemini' })
.build();

const result = await agent.invoke({
  objective: "Research using stored knowledge",
  prompt: "Use the rag-knowledge tool to search for information about DelReact framework capabilities."
});
```

### 4. Web Interface

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

#### `loadFile` - Load Knowledge from File
```javascript
{
  action: "loadFile",
  filePath: "./path/to/knowledge.json", // or .pdf, .txt
  agentConfig: { openaiKey: "sk-..." } // optional for embeddings
}
```

**Supported file formats:**
- **JSON**: Various structures supported:
  - Array of knowledge items: `[{content, metadata}, ...]`
  - Object with knowledge array: `{knowledge: [{content, metadata}, ...]}`
  - Single item: `{content, metadata}`
  - Pre-existing embeddings: `{content, metadata, embedding: [...]}`
- **PDF**: Placeholder (content parsing not yet implemented)
- **Text files**: Loaded as single knowledge items

#### `loadBulk` - Bulk Load Knowledge Items
```javascript
{
  action: "loadBulk",
  items: [
    {
      content: "Content 1",
      metadata: { category: "test" },
      id: "custom-id-1", // optional
      embedding: [0.1, 0.2, 0.3] // optional pre-computed embedding
    },
    {
      content: "Content 2",
      metadata: { category: "test" }
      // embedding will be generated if OpenAI key provided
    }
  ],
  agentConfig: { openaiKey: "sk-..." } // optional for embedding generation
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

#### `export` - Export Knowledge
```javascript
{
  action: "export",
  format: "json", // or "buffer"
  includeEmbeddings: true // optional, default true
}
```

**Export formats:**
- **JSON**: Returns knowledge as structured JSON object
- **Buffer**: Returns knowledge as Buffer object for binary storage

#### `saveToFile` - Save Knowledge to Filesystem
```javascript
{
  action: "saveToFile",
  filePath: "/path/to/export.json",
  format: "json", // or "buffer"
  includeEmbeddings: true // optional, default true
}
```

**Use cases:**
- Backup knowledge bases to files
- Export for external processing
- Create knowledge snapshots
- Transfer knowledge between systems

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

### ReactAgentBuilder Knowledge Initialization

```javascript
const agent = new ReactAgentBuilder({
  // ... other config
  knowledgeFiles: [
    './docs/api-reference.json',
    './manuals/user-guide.pdf'
  ],
  initialKnowledge: [
    {
      content: "Framework-specific knowledge",
      metadata: { source: "initialization" },
      embedding: [0.1, 0.2, 0.3] // optional pre-computed
    }
  ]
});
```

## Storage

The RAG tool uses an in-memory singleton storage by default, which means:
- Knowledge persists during the application session
- Knowledge is lost when the application restarts
- All tool calls share the same knowledge base

For production use, consider integrating with DelReact's memory backends (PostgreSQL, Redis) for persistent storage.

## High-Level Workflow Support

The enhanced RAG tool supports the complete workflow requested:

### 1. **User has embedding file in JSON or PDF Docs** ✅
- Load JSON files with pre-existing embeddings
- Support various JSON structures (arrays, objects, nested)
- PDF document loading (placeholder for future content parsing)

### 2. **Add knowledge when initializing ReactAgentBuilder** ✅  
```javascript
const agent = new ReactAgentBuilder({
  knowledgeFiles: ['./embeddings.json', './docs.pdf'],
  initialKnowledge: [{content: "...", embedding: [...]}]
});
```

### 3. **LLM uses RAG Tools during workflow invoke** ✅
- Agents automatically have access to rag-knowledge tool
- Can search and reference stored knowledge during execution
- Supports both semantic and text-based search

### 4. **Knowledge added compoundingly at runtime** ✅
- Add individual items via tool calls
- Bulk load additional knowledge during execution
- Knowledge persists across agent sessions

## Integration with Agents

The RAG tool is automatically registered in the DelReact tool registry and is available to all agents. Agents can:

1. **Pre-load domain knowledge** during ReactAgentBuilder initialization
2. **Search for relevant information** during reasoning using semantic or text search
3. **Build persistent knowledge bases** that grow across sessions
4. **Enhance responses** with contextual information from stored knowledge

## Examples

### Building a Knowledge Base from Files
```javascript
// Initialize with multiple knowledge sources
const agent = new ReactAgentBuilder({
  geminiKey: process.env.GEMINI_KEY,
  openaiKey: process.env.OPENAI_KEY,
  knowledgeFiles: [
    './company-docs.json',      // Company documentation
    './api-reference.json',     // API documentation  
    './user-feedback.pdf'       // User feedback documents
  ],
  initialKnowledge: [
    {
      content: "Custom business rules and policies",
      metadata: { source: "business-rules", priority: "high" }
    }
  ]
})
.init({ selectedProvider: 'gemini' })
.build();

// Agent now has access to all pre-loaded knowledge
const result = await agent.invoke({
  objective: "Answer customer question using company knowledge",
  prompt: "Search our knowledge base for information about API rate limits and provide a comprehensive answer."
});
```

### Loading Knowledge with Pre-existing Embeddings
```javascript
// example-embeddings.json
{
  "knowledge": [
    {
      "content": "React is a JavaScript library for building user interfaces.",
      "metadata": { "source": "React docs", "category": "frontend" },
      "embedding": [0.1, 0.2, -0.1, 0.5, 0.3, ...]  // 1536-dim OpenAI embedding
    },
    {
      "content": "Node.js is a JavaScript runtime built on Chrome's V8 engine.",
      "metadata": { "source": "Node.js docs", "category": "backend" },
      "embedding": [0.2, -0.1, 0.4, 0.1, 0.6, ...]
    }
  ]
}
```

### Intelligent Search with Semantic Similarity
```javascript
// Search finds relevant items even with different wording
const results = await ragToolDef.invoke({
  action: "search",
  query: "user interface library",
  agentConfig: { openaiKey: process.env.OPENAI_KEY }
});
// Returns React documentation due to semantic similarity
```

### Runtime Knowledge Growth
```javascript
const agent = new ReactAgentBuilder(config).build();

// Agent can add knowledge during execution
const response = await agent.invoke({
  objective: "Research and store findings",
  prompt: `Research information about microservices architecture. 
           Add your findings to the knowledge base using the rag-knowledge tool 
           so it can be referenced in future conversations.`
});
```

## Web Interface Features

The included web interface (`rag-web-interface.html`) provides:

- 📝 **Add Knowledge**: Forms for adding content with metadata
- 📁 **File Upload**: Load knowledge from JSON files via browser
- 🔍 **Search Interface**: Query knowledge with configurable results
- 📊 **Statistics**: Real-time stats on knowledge base size
- 🗂️ **Knowledge Management**: View, delete, and manage items
- 🧠 **Embedding Status**: Shows which items have vector embeddings
- 🎨 **Modern UI**: Responsive design with status notifications

## Testing

Run the comprehensive test suite:

```bash
node test-rag.js
```

This tests all enhanced RAG functionality including:
- File loading from various JSON structures
- Bulk loading with embeddings
- Error handling and validation
- Search functionality (text and semantic)
- CRUD operations

## Error Handling

The RAG tool provides comprehensive error handling:

- **Invalid actions**: Clear error messages for unsupported operations
- **Missing parameters**: Validation for required fields
- **File errors**: Graceful handling of missing or invalid files
- **OpenAI failures**: Graceful fallback to text search
- **Storage errors**: Proper error propagation and logging

## Performance Notes

- **In-memory storage**: Fast but limited by available RAM
- **Vector search**: O(n) complexity for similarity calculations
- **Text search**: Optimized term matching with early filtering
- **Singleton pattern**: Ensures consistent storage across tool calls
- **Bulk operations**: Efficient batch processing for large datasets

For large knowledge bases (>10,000 items), consider implementing:
- Database-backed storage
- Vector database integration (Pinecone, Weaviate, etc.)
- Pagination for large result sets
- Caching strategies

## Roadmap

Future enhancements may include:
- PDF content parsing integration
- Database persistence integration
- Multiple embedding providers
- Advanced search filters and faceting
- Knowledge versioning and history
- Import/export functionality
- Batch operations for large datasets
- Vector database backends