// src/core/agentConfig.ts
import { AgentState } from "./agentState";
import { LlmCallOptions, LlmProvider } from "./llm";
import { AgentTool } from "./toolkit";


/**
 * Agent context containing everything an agent method needs
*/
export interface AgentContext {
    state: AgentState;
    task: string;
    config: Record<string, any>;
    callLLM: (prompt: string, options?: LlmCallOptions) => Promise<string>;
    getAgentContext: (maxResults?: number) => Promise<string>;
}

/**
 * Agent configuration with minimal required props
 */
export interface AgentConfig {
    // Required minimal props
    name: string;
    provider: LlmProvider;
    model: string;
    apiKey?: string;
    description: string;

    // Optional customization
    errorStrategy?: 'fallback' | 'fail-fast';
    maxTokens?: number;
    tools?: AgentTool[];

    // Workflow context memory settings
    memory?: {
        rememberLastSteps?: number;      // Default: 3 - How many previous workflow steps to include
        maxTextPerStep?: number;         // Default: 120 - Character limit per step result
        includeWorkflowSummary?: boolean; // Default: true - Show full workflow overview
    };

    // Optional custom logic - if not provided, smart defaults are used
    planTask?: (ctx: Omit<AgentContext, 'task'>) => Promise<{ canExecute: boolean; plan: string; reason?: string }>;
    processTask?: (ctx: AgentContext) => Promise<string>;
    validateTask?: (ctx: AgentContext & { result: string }) => Promise<{ status: 'confirmed' | 'error'; reason?: string; fallbackAction?: string }>;
}





