// src/core/agentConfig.ts
import { AgentState } from "./agentState";
import { LlmCallOptions, LlmProvider } from "./llm";
import { AgentTool } from "./toolkit";
import { RAGConfig } from "./tools/ragSearch";


/**
 * Agent context containing everything an agent method needs for execution.
 * Provides access to state, configuration, and utility functions.
 */
export interface AgentContext {
    /** Current agent state with tasks and results */
    state: AgentState;
    /** Current task being executed */
    task: string;
    /** Agent configuration including LLM settings */
    config: Record<string, any>;
    /** Function to call LLM with automatic tool injection */
    callLLM: (prompt: string, options?: LlmCallOptions) => Promise<string>;
    /** Function to get agent context for memory and history */
    getAgentContext: (maxResults?: number) => Promise<string>;
}

/**
 * Configuration for creating custom agents with minimal required properties.
 * Supports optional customization for memory, tools, and RAG integration.
 */
export interface AgentConfig {
    // Required minimal properties
    /** Unique name for the agent */
    name: string;
    /** LLM provider to use (gemini, openai, openrouter) */
    provider: LlmProvider;
    /** Model name/ID for the provider */
    model: string;
    /** Optional API key (uses builder's key if not provided) */
    apiKey?: string;
    /** Description of what the agent does */
    description: string;

    // Optional customization
    /** Error handling strategy for agent failures */
    errorStrategy?: 'fallback' | 'fail-fast';
    /** Maximum tokens to generate in responses */
    maxTokens?: number;
    /** Custom tools available to this agent */
    tools?: AgentTool[];

    // Workflow context memory settings
    /** Memory configuration for workflow context */
    memory?: {
        /** How many previous workflow steps to include (default: 3) */
        rememberLastSteps?: number;
        /** Character limit per step result (default: 120) */
        maxTextPerStep?: number;
        /** Whether to show full workflow overview (default: true) */
        includeWorkflowSummary?: boolean;
    };

    // Agent-specific RAG configuration for isolated knowledge access
    /** RAG configuration for accessing specific knowledge bases */
    rag?: RAGConfig;

    // Optional custom logic - if not provided, smart defaults are used
    /** Custom task planning logic */
    planTask?: (ctx: Omit<AgentContext, 'task'>) => Promise<{ canExecute: boolean; plan: string; reason?: string }>;
    /** Custom task processing logic */
    processTask?: (ctx: AgentContext) => Promise<string>;
    /** Custom task validation logic */
    validateTask?: (ctx: AgentContext & { result: string }) => Promise<{ status: 'confirmed' | 'error'; reason?: string; fallbackAction?: string }>;
}





