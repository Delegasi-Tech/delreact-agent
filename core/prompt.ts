import { AgentState } from "./agentState";

export interface TaskBreakdownParams {
    objective: string;
    maxTasks: number;
    ragGuidance: string;
    sessionContext: string;
    documentContext: string;
    state: AgentState;
    config: Record<string, any>;
}

export interface TaskReplanningParams {
    objective: string;
    actionedTasks: string[];
    currentTasks: string[];
    actionResults: string[];
    ragGuidance: string;
    sessionContext: string;
    documentContext: string;
    state: AgentState;
    config: Record<string, any>;
}

export interface ActionAgentParams {
    objective: string;
    currentTask: string;
    sessionContext: string;
    documentContext: string;
    state: AgentState;
    config: Record<string, any>;
}

export interface SummarizerAgentParams {
    objective: string;
    actionResults: string[];
    formatInstruction: string;
    sessionContext: string;
    documentContext: string;
    state: AgentState;
    config: Record<string, any>;
}

export interface EnhancePromptParams {
    objective: string;
    sessionContext: string;
    documentContext: string;
    state: AgentState;
    config: Record<string, any>;
}

// Functional prompt type definitions
export type TaskBreakdownPrompt = string | ((params: TaskBreakdownParams) => string);
export type TaskReplanningPrompt = string | ((params: TaskReplanningParams) => string);
export type ActionAgentPrompt = string | ((params: ActionAgentParams) => string);
export type SummarizerAgentPrompt = string | ((params: SummarizerAgentParams) => string);
export type EnhancePromptPrompt = string | ((params: EnhancePromptParams) => string);

// Updated AgentPrompts interface
export interface AgentPrompts {
    taskBreakdown?: TaskBreakdownPrompt;
    taskReplanning?: TaskReplanningPrompt;
    actionAgent?: ActionAgentPrompt;
    summarizerAgent?: SummarizerAgentPrompt;
    enhancePrompt?: EnhancePromptPrompt;
}

// Default prompt functions
export const DEFAULT_PROMPTS = {
    taskBreakdown: (params: TaskBreakdownParams): string => {
        return `
  Break down this objective into a semicolon-separated list of tasks, using as few tasks as necessary to achieve the objective, but no more than ${params.maxTasks} tasks in total.
  Do not artificially split into exactly ${params.maxTasks} if fewer are sufficient.
  Always end the list with a summarize task "[summarize]".
  Only return the list in semicolon, do not answer or explain.
  
  Objective: "${params.objective}"
  ${params.ragGuidance}
  ${params.sessionContext}
  ${params.documentContext}`;
    },

    taskReplanning: (params: TaskReplanningParams): string => {
        const completedTasks = params.actionedTasks.join(", ");
        const currentPlan = params.currentTasks.join(", ");
        const results = params.actionResults.join(", ");

        return `
  The user has requested to replan the tasks for the objective "${params.objective}".
  
  Previously completed tasks: ${completedTasks}
  Current plan: ${currentPlan}
  Recent action results: ${results}
  ${params.ragGuidance}
  
  Analyze the above action results and, if needed, create a new and improved sequence of tasks to achieve the objective.
  Do not limit yourself to only changing, reordering, or removing the current set—be creative and generate new tasks or a new plan if new findings, requirements, or subtasks are discovered.
    - Remove tasks that are already completed or no longer needed.
    - Add new tasks or alter existing tasks if new subtasks or requirements are discovered.
    - Reorder or reprioritize tasks if necessary.
    - If all tasks are complete or the objective already achieved from results, return only the summarize task "[summarize]".
  The new plan should reflect the latest context and insights, not just incremental changes.
  
  Return only the updated tasks in a semicolon-separated list of tasks that still need to be done, in order. Do not include any explanation or previously completed tasks.`;
    },

    actionAgent: (params: ActionAgentParams): string => {
        return `You will only answer specific task/question in short and compact manner to achieve objective "${params.objective}".
  
  ${params.documentContext}
  
  Complete and answer the following task: "${params.currentTask}"`;
    },

    summarizerAgent: (params: SummarizerAgentParams): string => {
        const results = params.actionResults.join("\n");

        return `
  Summarize the following results for the user:
  ${results} , to achieve the objective: "${params.objective}"
  
  ${params.documentContext}
  
  Output Format Rules:
  ${params.formatInstruction}
  
  If you cannot summarize, then return "No summary available".`;
    },

    enhancePrompt: (params: EnhancePromptParams): string => {
        return `You are an assistant that help users to enhance their prompt so that the prompt is more clear and concise. Respond use this format:
  
  **Required Format:**
  \`\`\`
  <initial_enhancement>
  [Provide initial enhancement about user's prompt. This enhancement should be more clear and concise than the original prompt.]
  </initial_enhancement>
  
  <critique_initial_enhancement>
  [Analyze and critique the initial enhancement. Identify weaknesses, shortcomings, missed aspects, or areas that could be improved. Think critically about the initial enhancement.]
  </critique_initial_enhancement> 
  
  <final_enhancement>
  [Provide an improved and refined enhancement based on the critique. This enhancement should be more comprehensive, accurate, and complete compared to the initial enhancement. The final enhancement should be more clear and concise than the initial enhancement.]
  </final_enhancement>
  \`\`\`
  
  **User's Prompt:** ${params.objective}
  ${params.sessionContext}
  
  Please enhance the above prompt using the structured 3-part format.`;
    }
};

// Helper function to execute prompt (string or function)
export function executePrompt<T>(
    prompt: string | ((params: T) => string),
    params: T
): string {
    if (typeof prompt === 'function') {
        return prompt(params);
    }
    return prompt;
}