# ReactAgentBuilder Custom Workflow - Advanced Configuration Guide

This document extends the [Quick Reference](./ReactAgentBuilder-CustomWorkflow-Quick-Reference.md) with detailed configuration options for agents and workflows.

## Table of Contents
- [3-Phase Agent Execution Deep Dive](#3-phase-agent-execution-deep-dive)
- [RAG (Retrieval Augmented Generation) Integration](#rag-retrieval-augmented-generation-integration)
- [Complete Agent Configuration](#complete-agent-configuration)  
- [Complete Workflow Configuration](#complete-workflow-configuration)
- [Runtime Configuration Options](#runtime-configuration-options)
- [Real-World Implementation Patterns](#real-world-implementation-patterns)
- [Advanced Customization Examples](#advanced-customization-examples)

## 3-Phase Agent Execution Deep Dive

Every custom agent executes through three distinct phases that can be individually customized:

### Phase 1: Planning (`planTask`)
**Purpose**: Analyze the task context and create an actionable execution plan

**Default Behavior**:
```typescript
private static async plan(ctx: AgentContext): Promise<{
    canExecute: boolean;
    plan: string;
    reason?: string;
}> {
    // Uses LLM to create step-by-step plan
    // Always returns canExecute: true for workflow agents
    // Includes workflow context and memory-managed history
}
```

**Custom Override**:
```typescript
const customPlanningAgent = builder.createAgent({
    name: "CustomPlanningAgent",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Agent with custom planning logic",
    
    planTask: async (ctx: AgentContext) => {
        // Access full context
        const objective = ctx.state.objective;
        const previousResults = ctx.state.actionResults;
        const currentTask = ctx.task;
        
        // Custom planning logic
        if (objective.toLowerCase().includes('urgent')) {
            return {
                canExecute: true,
                plan: "Execute with high priority and detailed analysis",
                reason: "Urgent request detected"
            };
        }
        
        if (previousResults.length > 5) {
            return {
                canExecute: false,
                plan: "Cannot process",
                reason: "Too many previous steps - workflow too complex"
            };
        }
        
        // Conditional planning based on context
        const complexity = analyzeTaskComplexity(currentTask);
        return {
            canExecute: complexity < 8,
            plan: complexity < 4 
                ? "Simple analysis and response" 
                : "Multi-step analysis with validation",
            reason: complexity >= 8 ? "Task too complex for this agent" : "Ready to proceed"
        };
    }
});
```

**Planning Context Available**:
```typescript
interface AgentContext {
    state: AgentState;           // Full workflow state
    task: string;                // Memory-enhanced task description
    config: Record<string, any>; // Execution configuration
    callLLM: (prompt: string, options?: LlmCallOptions) => Promise<string>;
    getAgentContext: (maxResults?: number) => Promise<string>; // JSON context
}
```

### Phase 2: Processing (`processTask`)
**Purpose**: Execute the planned task using available tools and context

**Default Behavior**:
```typescript
private static async process(ctx: AgentContext, plan: string): Promise<string> {
    // Uses LLM with full workflow context
    // Includes objective, plan, and memory-managed history
    // Returns execution result
}
```

**Custom Override**:
```typescript
const customProcessingAgent = builder.createAgent({
    name: "CustomProcessingAgent",
    model: "gemini-1.5-flash",
    provider: "gemini",
    description: "Agent with custom processing logic",
    
    processTask: async (ctx: AgentContext) => {
        // Access workflow state
        const { objective, actionResults, agentPhaseHistory } = ctx.state;
        
        // Custom processing based on agent history
        if (agentPhaseHistory.includes('DataCollectionAgent')) {
            const dataResult = actionResults.find(r => r.includes('data:'));
            if (dataResult) {
                const extractedData = parseDataFromResult(dataResult);
                return await processWithExternalAPI(extractedData);
            }
        }
        
        // Conditional processing based on task type
        if (ctx.task.includes('analysis')) {
            return await performDetailedAnalysis(ctx.state);
        } else if (ctx.task.includes('summary')) {
            return await generateSummary(actionResults);
        }
        
        // Fallback to LLM processing
        const prompt = `Process this task: ${ctx.task}\nContext: ${JSON.stringify(ctx.state)}`;
        return await ctx.callLLM(prompt, { temperature: 0.2 });
    },
    
    tools: [dataProcessingTool, analysiseTool] // Tools available during processing
});
```

### Phase 3: Validation (`validateTask`)
**Purpose**: Validate execution results and handle errors gracefully

**Default Behavior**:
```typescript
private static async validate(ctx: AgentContext, result: string): Promise<{
    status: 'confirmed' | 'error';
    reason?: string;
}> {
    // Uses LLM to validate result quality
    // Defaults to 'confirmed' if validation fails (workflow progression)
    // Lenient validation for routing agents
}
```

**Custom Override**:
```typescript
const customValidationAgent = builder.createAgent({
    name: "CustomValidationAgent", 
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Agent with strict custom validation",
    
    validateTask: async (ctx: AgentContext & { result: string }) => {
        const { result, state, task } = ctx;
        
        // Custom validation rules
        if (task.includes('data analysis') && !result.includes('statistics')) {
            return {
                status: 'error',
                reason: 'Data analysis must include statistical information'
            };
        }
        
        if (result.length < 50) {
            return {
                status: 'error', 
                reason: 'Response too short - insufficient detail'
            };
        }
        
        // Validate against previous results for consistency
        const previousResults = state.actionResults;
        if (previousResults.some(prev => prev === result)) {
            return {
                status: 'error',
                reason: 'Duplicate response detected - agent not adding value'
            };
        }
        
        // JSON validation for structured outputs
        if (task.includes('json') || task.includes('structured')) {
            try {
                JSON.parse(result);
                return { status: 'confirmed', reason: 'Valid JSON structure' };
            } catch {
                return { status: 'error', reason: 'Invalid JSON format' };
            }
        }
        
        return { status: 'confirmed', reason: 'All validation checks passed' };
    }
});

## RAG (Retrieval Augmented Generation) Integration

ReactAgentBuilder supports RAG integration to enhance agents with domain-specific knowledge from external documents. This enables agents to provide accurate, up-to-date information from your knowledge base rather than relying solely on training data.

### Basic RAG Configuration

```typescript
const knowledgeAgent = builder.createAgent({
    name: "KnowledgeAgent",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Answer questions using company knowledge base",
    
    // RAG configuration
    rag: {
        vectorFiles: ["/path/to/knowledge.json"],           // Required: Vector database files
        embeddingModel: "text-embedding-3-small",           // Required: Embedding model
        threshold: 0.5,                                     // Optional: Similarity threshold (0-1)
        topK: 3                                            // Optional: Number of results to retrieve
    }
});
```

### RAG Configuration Options

```typescript
interface RagConfig {
    vectorFiles: string[];              // Array of JSON vector database files
    embeddingModel: string;             // Embedding model (e.g., "text-embedding-3-small")
    threshold?: number;                 // Similarity threshold (default: 0.7)
    topK?: number;                      // Max results to retrieve (default: 5)
}
```

### Embedding Models
- **text-embedding-3-small**: Fast, cost-effective, good for most use cases
- **text-embedding-3-large**: Higher accuracy, more expensive
- **text-embedding-ada-002**: Legacy model, still supported

### Similarity Threshold Guidelines

```typescript
// High precision, may miss relevant content
threshold: 0.8    // Use for: Exact matches, technical documentation

// Balanced precision and recall (recommended)
threshold: 0.5    // Use for: General Q&A, customer support, mixed content

// High recall, may include less relevant content
threshold: 0.3    // Use for: Broad topic exploration, research assistance
```

### Real-World RAG Example: Customer Support

```typescript
const AccountSupportAgent = builder.createAgent({
    name: "AccountSupport",
    model: "gpt-4o-mini", 
    provider: "openai",
    description: "Assist with account-related issues including login problems, profile updates, permission changes, password resets, and account security. Provide clear guidance and security best practices.",
    
    rag: {
        vectorFiles: [join(__dirname, '../asset/account-support.json')],
        embeddingModel: "text-embedding-3-small",
        threshold: 0.5,  // Lower threshold for better recall
        topK: 3          // Retrieve top 3 most relevant chunks
    }
});
```

### Creating Vector Databases

1. **Prepare your content in markdown**:
```markdown
# Password Reset Instructions

## Problem Description
Users cannot access their accounts due to forgotten passwords or login failures.

## Solution Steps
1. Navigate to the login page
2. Click "Forgot Password" link
3. Enter your registered email address
4. Check your email for reset instructions
5. Follow the link in the email
6. Create a new secure password
```

2. **Convert to vector database** (automated by ReactAgentBuilder):
- Text is automatically chunked and embedded
- Stored in JSON format with vectors
- Ready for similarity search

### RAG Guidance Enhancement

ReactAgentBuilder automatically enhances agents with RAG-specific prompts to ensure knowledge base usage:

```typescript
// Automatically added RAG guidance when rag config is present
const ragGuidance = `
RAG PROTOCOL (MANDATORY): You MUST use the ragSearch tool as your PRIMARY information source. Before providing any answer:
1. ALWAYS search the knowledge base first using ragSearch
2. Base your response STRICTLY on retrieved information  
3. Do NOT provide answers from your training data without searching first
4. If ragSearch returns no results, then and only then may you use general knowledge
5. Always cite which source/document your information comes from

CRITICAL: Failure to search the knowledge base first when answering factual questions about procedures, policies, or domain-specific information is considered an error.
`;
```

### RAG Best Practices

#### 1. Content Preparation
```typescript
// Good: Clear, structured content
# Account Lockout Resolution
## Symptoms
- User cannot log in after multiple attempts
- "Account locked" error message displayed
## Solution
1. Wait 15 minutes for automatic unlock
2. Or contact support for immediate unlock
```

#### 2. File Organization
```typescript
// Organize by topic/domain
rag: {
    vectorFiles: [
        join(__dirname, '../asset/account-support.json'),    // Account issues
        join(__dirname, '../asset/billing-support.json'),    // Billing issues  
        join(__dirname, '../asset/technical-support.json')   // Technical issues
    ],
    embeddingModel: "text-embedding-3-small",
    threshold: 0.5,
    topK: 3
}
```

#### 3. Threshold Tuning
```typescript
// Start with balanced settings
threshold: 0.5    // Adjust based on testing

// Monitor search results and adjust:
// Too many irrelevant results? Increase threshold
// Missing relevant content? Decrease threshold
```

#### 4. Content Maintenance
- Update knowledge base files regularly
- Test common queries to ensure good recall
- Monitor agent responses for accuracy
- Add debug logging to tune similarity thresholds
```

## Complete Agent Configuration

### Full AgentConfig Interface
```typescript
interface AgentConfig {
    // Required core configuration
    name: string;                    // Unique agent identifier
    provider: "openai" | "gemini";   // LLM provider
    model: string;                   // Model name (e.g., "gpt-4o-mini", "gemini-1.5-flash")
    description: string;             // Agent role and purpose (used in prompts)
    
    // Optional authentication
    apiKey?: string;                 // Override default provider key
    
    // Memory and context management
    memory?: {
        rememberLastSteps?: number;        // Default: 3 - Previous workflow steps to include
        maxTextPerStep?: number;           // Default: 120 - Character limit per step result
        includeWorkflowSummary?: boolean;  // Default: true - Show full workflow overview
    };
    
    // Error handling strategy
    errorStrategy?: "fallback" | "fail-fast";  // Default: "fallback"
    
    // LLM configuration
    maxTokens?: number;              // Default: model-dependent
    temperature?: number;            // Default: model-dependent
    
    // Tool integration
    tools?: AgentTool[];            // Available tools for this agent
    
    // Custom phase overrides
    planTask?: (ctx: Omit<AgentContext, 'task'>) => Promise<{
        canExecute: boolean;
        plan: string;
        reason?: string;
    }>;
    
    processTask?: (ctx: AgentContext) => Promise<string>;
    
    validateTask?: (ctx: AgentContext & { result: string }) => Promise<{
        status: 'confirmed' | 'error';
        reason?: string;
        fallbackAction?: string;
    }>;
}
```

### Memory Configuration Strategies

#### Performance-Optimized (Fast Execution)
```typescript
memory: {
    rememberLastSteps: 1,           // Minimal context
    maxTextPerStep: 50,             // Short summaries
    includeWorkflowSummary: false   // No workflow overview
}
// Use case: Simple routing agents, status checks
// Token usage: ~50-100 tokens
// Speed: Fastest
```

#### Standard Configuration (Recommended)
```typescript
memory: {
    rememberLastSteps: 3,           // Recent context (default)
    maxTextPerStep: 120,            // Balanced detail (default)  
    includeWorkflowSummary: true    // Include workflow overview (default)
}
// Use case: General purpose agents, analysis tasks
// Token usage: ~200-300 tokens
// Speed: Balanced
```

#### Context-Rich Configuration (Detailed Analysis)
```typescript
memory: {
    rememberLastSteps: 5,           // Extended context
    maxTextPerStep: 200,            // Detailed summaries
    includeWorkflowSummary: true    // Full workflow awareness
}
// Use case: Complex analysis, final summary agents
// Token usage: ~400-600 tokens  
// Speed: Slower but more informed
```

#### Specialized Configurations
```typescript
// For routing/classification agents
memory: {
    rememberLastSteps: 1,
    maxTextPerStep: 80,
    includeWorkflowSummary: false
}

// For data processing agents
memory: {
    rememberLastSteps: 2,
    maxTextPerStep: 150,
    includeWorkflowSummary: true
}

// For final summary/conclusion agents
memory: {
    rememberLastSteps: 10,          // See entire workflow
    maxTextPerStep: 100,            // Concise summaries
    includeWorkflowSummary: true    // Essential for conclusions
}
```

### Error Strategy Configuration

#### Fallback Strategy (Default)
```typescript
{
    errorStrategy: "fallback"
}
```
**Behavior**:
- Logs errors but continues workflow
- Replaces failed result with error message
- Allows workflow to complete despite failures
- **Best for**: Non-critical operations, data collection, optional enhancements

#### Fail-Fast Strategy
```typescript
{
    errorStrategy: "fail-fast"
}
```
**Behavior**:
- Immediately stops workflow on error
- Throws error up to caller
- Prevents inconsistent state progression
- **Best for**: Critical validation, security checks, data integrity operations

## Complete Workflow Configuration

### Workflow Builder Configuration
```typescript
interface WorkflowConfig {
    timeout?: number;        // Default: 30000ms - Overall workflow timeout
    retries?: number;        // Default: 0 - Number of retry attempts
    debug?: boolean;         // Default: false - Enable debug logging
    sessionId?: string;      // Optional session identifier
}

// Usage
const workflow = builder.createWorkflow("WorkflowName", {
    timeout: 60000,          // 60 second timeout
    retries: 2,              // Retry failed operations twice
    debug: true,             // Enable detailed logging
    sessionId: "user-123"    // Custom session tracking
});
```

### ReactAgentBuilder Configuration
```typescript
interface ReactAgentConfig {
    // Provider API keys
    geminiKey?: string;      // Google Gemini API key
    openaiKey?: string;      // OpenAI API key
    
    // Optional features
    useEnhancedPrompt?: boolean;     // Default: false - Enhanced prompt processing
    memory?: "in-memory" | "postgres" | "redis";  // Default: "in-memory" - Memory backend
    enableToolSummary?: boolean;     // Default: true - LLM tool result summaries
    sessionId?: string;              // Default session ID for workflows
    
    // Additional API keys
    braveApiKey?: string;           // For web search functionality
    heliconeKey?: string;           // For OpenAI request logging
    
    // Advanced features
    useSubgraph?: boolean;          // Default: false - Enable subgraph mode
}

// Usage
const builder = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    openaiKey: process.env.OPENAI_KEY,
    memory: "in-memory",
    enableToolSummary: true,
    useEnhancedPrompt: false,
    sessionId: "default-session"
});
```

## Runtime Configuration Options

### Agent Invoke Configuration
```typescript
// Individual agent execution
const result = await agent.invoke(
    // Input (string or object)
    "Analyze customer feedback data",
    // or
    {
        objective: "Analyze customer feedback data",
        outputInstruction: "Provide structured analysis with actionable insights"
    },
    
    // Runtime configuration (optional)
    {
        temperature: 0.1,        // Override agent's default temperature
        maxTokens: 2000,         // Override token limit
        provider: "gemini",      // Override provider
        model: "gemini-1.5-pro", // Override model
        debug: true,             // Enable debug logging for this execution
        timeout: 45000           // Custom timeout for this execution
    }
);
```

### Workflow Invoke Configuration
```typescript
// Workflow execution
const result = await workflow.invoke(
    // Required input
    {
        objective: "Process customer support request",
        outputInstruction?: "Provide professional response with next steps"
    }
);

// Result format
interface WorkflowResult {
    conclusion: string;          // Final workflow result
    sessionId: string;          // Session identifier
    fullState: AgentState;      // Complete workflow state
    error?: string;             // Error message if workflow failed
}
```

### Access Agent Configuration at Runtime
```typescript
// Get agent configuration
const config = agent.getConfig();

console.log("Agent name:", config.name);
console.log("Memory settings:", config.memory);
console.log("Error strategy:", config.errorStrategy);
console.log("Available tools:", config.tools?.length || 0);

// Use configuration for dynamic behavior
if (config.memory?.rememberLastSteps > 3) {
    console.log("Agent uses rich context");
} else {
    console.log("Agent uses minimal context");
}
```

## Real-World Implementation Patterns

This section showcases actual implementation patterns from production workflows, demonstrating practical applications of ReactAgentBuilder features.

### Customer Support Workflow Pattern

A complete customer support workflow with intelligent routing and RAG-powered responses:

```typescript
// Real implementation from example/cases/customerSupport.ts
const builder = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    openaiKey: process.env.OPENAI_KEY,
});

// 1. Gate Agent: Binary classification for intent detection
const GateQuestionAgent = builder.createAgent({
    name: "GateQuestion",
    model: "gemini-2.0-flash",
    provider: "gemini",
    description: "Analyze the user's intent. If the user wants to start a support session, your final output must be exactly the single word: 'yes'. Otherwise, output exactly: 'no'. Do not provide any additional explanation or text.",
});

// 2. Classification Agent: Multi-category routing
const IdentifyIssueAgent = builder.createAgent({
    name: "IdentifyIssue", 
    model: "gpt-4.1-mini",
    provider: "openai",
    description: "Analyze the customer's problem and categorize it into: 'billing' (invoices, payments, charges), 'technical' (software, hardware, connectivity), 'account' (login, profile, permissions), or 'general' (other inquiries). Output exactly one word.",
});

// 3. Specialized Support Agents with RAG
const AccountSupportAgent = builder.createAgent({
    name: "AccountSupport",
    model: "gpt-4o-mini",
    provider: "openai", 
    description: "Assist with account-related issues including login problems, profile updates, permission changes, password resets, and account security. Provide clear guidance and security best practices.",
    rag: {
        vectorFiles: [join(__dirname, '../asset/account-support.json')],
        embeddingModel: "text-embedding-3-small",
        threshold: 0.5,
        topK: 3
    }
});

// 4. Workflow Implementation
async function buildCustomerSupportWorkflow() {
    const mainFlow = builder.createWorkflow("CustomerServiceWorkflow", {
        debug: true,
        timeout: 80000,
    });

    mainFlow.start(GateQuestionAgent);

    // Binary routing based on user intent
    const { ifTrue: successPath, ifFalse: feedbackPath } = mainFlow.branch({
        condition: (state) => state.lastActionResult?.toLowerCase().includes('yes'),
        ifTrue: IdentifyIssueAgent,
        ifFalse: RequestFeedbackAgent,
    });

    // Multi-way routing based on issue category
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

    // Merge all paths and conclude
    mainFlow.merge([billing, technical, account, general, feedbackPath])
        .then(SummarizeInteractionAgent);

    return mainFlow.build();
}
```

### Multi-Model Strategy Pattern

Using different models for different agent roles based on their strengths:

```typescript
// Fast classification with Gemini
const ClassificationAgent = builder.createAgent({
    name: "IssueClassifier",
    model: "gemini-2.0-flash",      // Fast, cost-effective
    provider: "gemini",
    description: "Quickly categorize user requests into predefined categories"
});

// Detailed analysis with GPT-4
const AnalysisAgent = builder.createAgent({
    name: "DetailedAnalyzer", 
    model: "gpt-4o-mini",           // More capable reasoning
    provider: "openai",
    description: "Perform detailed analysis and provide comprehensive responses"
});

// High-throughput processing with Gemini Flash
const ProcessingAgent = builder.createAgent({
    name: "DataProcessor",
    model: "gemini-2.5-flash",      // Fast processing
    provider: "gemini",
    description: "Process large amounts of data quickly"
});
```

### Conditional Routing Patterns

```typescript
// Complex condition functions for sophisticated routing
const shouldProceedCondition = (state: AgentState): boolean => {
    const lastResult = state.lastActionResult || '';
    const result = lastResult.toLowerCase().includes('yes');
    console.log("🔍 shouldProceedCondition - returning:", result);
    return result;
};

const issueCategoryCondition = (state: AgentState): string => {
    const lastResult = state.lastActionResult || '';
    console.log("🔍 issueCategoryCondition - lastResult:", lastResult);

    if (lastResult.toLowerCase().includes('billing')) {
        console.log("🔍 issueCategoryCondition - returning: billing");
        return 'billing';
    }
    if (lastResult.toLowerCase().includes('technical')) {
        console.log("🔍 issueCategoryCondition - returning: technical");
        return 'technical';
    }
    if (lastResult.toLowerCase().includes('account')) {
        console.log("🔍 issueCategoryCondition - returning: account");
        return 'account';
    }

    console.log("🔍 issueCategoryCondition - returning: default");
    return 'default';
};
```

### Testing and Validation Pattern

```typescript
async function testWorkflowWithScenarios() {
    const scenarios = [
        "I have a problem with my latest invoice, it seems incorrect.",
        "I can't log into my account, how do I reset my password?", 
        "The software keeps crashing when I try to export data.",
        "What are your business hours and return policy?",
        "No thanks, I'm just browsing."
    ];

    const workflow = await buildCustomerSupportWorkflow();
    
    for (const scenario of scenarios) {
        console.log(`🧪 Testing scenario: ${scenario}`);
        const result = await workflow.invoke({ objective: scenario });
        console.log(`📋 Result: ${result.conclusion}`);
        console.log("=" .repeat(80));
    }
}
```

### Memory Optimization Patterns

```typescript
// Routing agents: minimal memory for fast decisions
const RouterAgent = builder.createAgent({
    name: "Router",
    model: "gemini-2.0-flash",
    provider: "gemini",
    description: "Route requests to appropriate handlers",
    memory: {
        rememberLastSteps: 1,
        maxTextPerStep: 50,
        includeWorkflowSummary: false
    }
});

// Analysis agents: balanced memory for context awareness
const AnalyzerAgent = builder.createAgent({
    name: "Analyzer",
    model: "gpt-4o-mini", 
    provider: "openai",
    description: "Analyze and process complex requests",
    memory: {
        rememberLastSteps: 3,
        maxTextPerStep: 120,
        includeWorkflowSummary: true
    }
});

// Summary agents: rich memory for comprehensive conclusions
const SummaryAgent = builder.createAgent({
    name: "Summarizer",
    model: "gpt-4o-mini",
    provider: "openai", 
    description: "Provide final summaries and conclusions",
    memory: {
        rememberLastSteps: 5,
        maxTextPerStep: 150,
        includeWorkflowSummary: true
    }
});
```

### Error Handling Patterns

```typescript
// Critical path: fail-fast for data integrity
const ValidationAgent = builder.createAgent({
    name: "DataValidator",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Validate critical data integrity",
    errorStrategy: "fail-fast"  // Stop workflow on validation errors
});

// Optional enhancement: fallback for robustness  
const EnhancementAgent = builder.createAgent({
    name: "ContentEnhancer",
    model: "gemini-2.0-flash",
    provider: "gemini",
    description: "Optional content enhancements",
    errorStrategy: "fallback"   // Continue workflow if enhancement fails
});
```

### Production Deployment Patterns

```typescript
// Environment-based configuration
const builder = new ReactAgentBuilder({
    geminiKey: process.env.GEMINI_KEY,
    openaiKey: process.env.OPENAI_KEY,
    sessionId: process.env.NODE_ENV === 'production' 
        ? `prod-${Date.now()}` 
        : `dev-${Date.now()}`
});

// Workflow with production settings
const productionWorkflow = builder.createWorkflow("ProductionWorkflow", {
    timeout: 120000,    // Longer timeout for production
    retries: 2,         // Retry failed operations
    debug: process.env.NODE_ENV !== 'production'
});
```

These patterns demonstrate how ReactAgentBuilder scales from simple sequential workflows to complex, multi-path routing systems with intelligent agent specialization and robust error handling.

## Advanced Customization Examples

### Multi-Modal Agent with Custom Phases
```typescript
const multiModalAgent = builder.createAgent({
    name: "MultiModalAnalyzer",
    model: "gpt-4o-mini", 
    provider: "openai",
    description: "Analyze text, code, and data with specialized processing",
    memory: {
        rememberLastSteps: 4,
        maxTextPerStep: 180,
        includeWorkflowSummary: true
    },
    
    planTask: async (ctx) => {
        const contentType = detectContentType(ctx.state.objective);
        
        switch (contentType) {
            case 'code':
                return {
                    canExecute: true,
                    plan: "Perform static code analysis, identify patterns, and suggest improvements",
                    reason: "Code content detected"
                };
            case 'data':
                return {
                    canExecute: true,
                    plan: "Statistical analysis, trend identification, and insights generation",
                    reason: "Data content detected"
                };
            case 'text':
                return {
                    canExecute: true,
                    plan: "Sentiment analysis, entity extraction, and content summarization",
                    reason: "Text content detected"
                };
            default:
                return {
                    canExecute: false,
                    plan: "Cannot determine content type",
                    reason: "Unsupported content format"
                };
        }
    },
    
    processTask: async (ctx) => {
        const contentType = detectContentType(ctx.state.objective);
        
        if (contentType === 'code') {
            return await analyzeCode(ctx.state.objective);
        } else if (contentType === 'data') {
            return await analyzeData(ctx.state.objective);
        } else {
            return await analyzeText(ctx.state.objective);
        }
    },
    
    validateTask: async (ctx) => {
        const result = ctx.result;
        
        // Ensure result contains required sections
        const requiredSections = ['analysis', 'insights', 'recommendations'];
        const hasAllSections = requiredSections.every(section => 
            result.toLowerCase().includes(section)
        );
        
        if (!hasAllSections) {
            return {
                status: 'error',
                reason: `Missing required sections: ${requiredSections.join(', ')}`
            };
        }
        
        return { status: 'confirmed', reason: 'Complete analysis provided' };
    }
});
```

### Context-Aware Processing Agent
```typescript
const contextAwareAgent = builder.createAgent({
    name: "ContextAwareProcessor",
    model: "gemini-1.5-flash",
    provider: "gemini", 
    description: "Adapt processing based on workflow context and history",
    
    processTask: async (ctx) => {
        const { state } = ctx;
        const workflowLength = state.agentPhaseHistory.length;
        const previousAgents = state.agentPhaseHistory;
        const results = state.actionResults;
        
        // Adapt based on workflow position
        if (workflowLength === 1) {
            // First agent after start - set foundation
            return await establishContext(state.objective);
        } else if (workflowLength < 4) {
            // Early workflow - build on previous results
            const recentResults = results.slice(-2);
            return await buildOnResults(recentResults, state.objective);
        } else {
            // Later workflow - synthesize and conclude
            const allResults = results.join('\n');
            return await synthesizeResults(allResults, state.objective);
        }
    },
    
    memory: {
        rememberLastSteps: Math.min(5, state => state.agentPhaseHistory.length),
        maxTextPerStep: 150,
        includeWorkflowSummary: true
    }
});
```

### Conditional Tool Usage Agent
```typescript
const conditionalToolAgent = builder.createAgent({
    name: "ConditionalToolAgent",
    model: "gpt-4o-mini",
    provider: "openai",
    description: "Use different tools based on task requirements",
    tools: [webSearchTool, dataAnalysisTool, codeExecutorTool],
    
    planTask: async (ctx) => {
        const objective = ctx.state.objective.toLowerCase();
        
        let requiredTools = [];
        let plan = "";
        
        if (objective.includes('search') || objective.includes('latest')) {
            requiredTools.push('webSearch');
            plan += "Search for current information. ";
        }
        
        if (objective.includes('analyze') || objective.includes('data')) {
            requiredTools.push('dataAnalysis');
            plan += "Perform data analysis. ";
        }
        
        if (objective.includes('code') || objective.includes('execute')) {
            requiredTools.push('codeExecution');
            plan += "Execute code analysis. ";
        }
        
        return {
            canExecute: requiredTools.length > 0,
            plan: plan || "Process using standard LLM capabilities",
            reason: requiredTools.length === 0 
                ? "No specialized tools required"
                : `Will use tools: ${requiredTools.join(', ')}`
        };
    },
    
    processTask: async (ctx) => {
        const objective = ctx.state.objective.toLowerCase();
        let result = "";
        
        // Use tools conditionally
        if (objective.includes('search')) {
            const searchResults = await webSearchTool.execute({ query: extractQuery(objective) });
            result += `Search Results: ${searchResults}\n`;
        }
        
        if (objective.includes('analyze')) {
            const analysisData = extractDataFromObjective(objective);
            const analysis = await dataAnalysisTool.execute({ data: analysisData });
            result += `Analysis: ${analysis}\n`;
        }
        
        // Synthesize with LLM
        const finalPrompt = `
            Synthesize the following information to answer: ${ctx.state.objective}
            
            Information gathered: ${result}
            
            Provide a comprehensive response.
        `;
        
        const synthesis = await ctx.callLLM(finalPrompt);
        return result + synthesis;
    }
});
```

This advanced configuration guide provides comprehensive control over agent behavior and workflow execution, enabling sophisticated AI automation workflows with precise customization at every level.