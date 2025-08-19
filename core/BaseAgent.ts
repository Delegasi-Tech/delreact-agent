// src/core/BaseAgent.ts
import { AgentState } from "./agentState";
import { llmCall } from "./llm";
import { toolRegistry } from "./tools/registry";

/**
 * Abstract base class for all agents in the DelReact framework.
 * Provides common utilities and enforces consistent agent patterns across implementations.
 * All custom agents should extend this class to inherit standardized LLM calling,
 * state management, and logging capabilities.
 * 
 * @example
 * ```typescript
 * export class CustomAgent extends BaseAgent {
 *   static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
 *     const state = input as AgentState;
 *     const result = await CustomAgent.callLLM("Process this task", config);
 *     return { ...state, actionResults: [...state.actionResults, result] };
 *   }
 * }
 * ```
 */
export abstract class BaseAgent {
  /**
   * Call LLM with standardized configuration and automatic tool injection.
   * This method provides a consistent interface for all agents to interact with LLMs,
   * automatically injecting available tools and handling observability settings.
   * 
   * @param prompt - The prompt text to send to the LLM
   * @param config - Configuration object containing provider settings, API keys, and tool context
   * @param additionalHeaders - Optional additional HTTP headers for the LLM request
   * @returns Promise resolving to the LLM response string
   * 
   * @example
   * ```typescript
   * const response = await MyAgent.callLLM(
   *   "Analyze the following data: " + data,
   *   config
   * );
   * ```
   */
  public static async callLLM(
    prompt: string, 
    config: Record<string, any>, 
    additionalHeaders?: Record<string, string>
  ): Promise<string> {
    // Get only available tools from registry based on agent config
    const agentConfig = config?.configurable?.agentConfig || {};
    const tools = toolRegistry.createToolsWithConfig({...agentConfig, debug : config?.configurable?.debug});

    // Log tools being used and availability status
    this.logExecution(this.name, "Available tools", tools.map(t => t.name));
    this.logExecution(this.name, "Tool availability status", toolRegistry.getToolAvailabilityStatus({ agentConfig }));

    return llmCall(prompt, {
      ...config?.configurable,
      provider: config?.configurable?.selectedProvider,
      model: config?.configurable?.model,
      apiKey: config?.configurable?.selectedKey,
      observability: {
        enabled: config?.configurable?.observability?.enabled || false,
        heliconeKey: config?.configurable?.heliconeKey,
        userId: config?.configurable?.observability?.userId,
        cacheEnabled: config?.configurable?.observability?.cacheEnabled,
        sessionName: config?.configurable?.observability?.sessionName,
        additionalHeaders: config?.configurable?.observability?.additionalHeaders,
      },
      sessionId: config?.configurable?.sessionId,
      memory: config?.configurable?.memory, // Pass memory context for smart retrieval
      enableToolSummary: config?.configurable?.enableToolSummary,
      maxTokens: config?.configurable?.maxTokens,
      temperature: config?.configurable?.temperature,
      tools: tools,
      addHeaders: {
        ...additionalHeaders
      }
    });
  }

  /**
   * Get the current task from agent state.
   * Helper method to safely retrieve the task at the current index.
   * 
   * @param state - The current agent state
   * @returns Current task string, or empty string if no task available
   * 
   * @example
   * ```typescript
   * const currentTask = MyAgent.getCurrentTask(state);
   * if (currentTask) {
   *   // Process the current task
   * }
   * ```
   */
  protected static getCurrentTask(state: AgentState): string {
    const task = state.tasks[state.currentTaskIndex];
    return task || "";
  }

  /**
   * Update action results and move to next task.
   * Standardized method for recording task completion and advancing the workflow.
   * 
   * @param state - Current agent state
   * @param result - Result string from task execution
   * @param taskToUpdate - Optional specific task to update (defaults to current task)
   * @returns Partial state update with new results and incremented task index
   * 
   * @example
   * ```typescript
   * const result = "Task completed successfully";
   * return MyAgent.updateActionResults(state, result);
   * ```
   */
  protected static updateActionResults(
    state: AgentState, 
    result: string, 
    taskToUpdate?: string
  ): Partial<AgentState> {
    const task = taskToUpdate || state.tasks[state.currentTaskIndex];
    return {
      actionResults: [...state.actionResults, result],
      actionedTasks: [...state.actionedTasks, task],
      lastActionResult: result,
      currentTaskIndex: state.currentTaskIndex + 1,
      agentPhaseHistory: [...state.agentPhaseHistory, 'ActionAgent']
    };
  }

  /**
   * Standardized logging for agent execution with event emission support.
   * Provides consistent logging across all agents and enables monitoring through events.
   * 
   * @param agentName - Name of the agent performing the operation
   * @param operation - Type of operation being logged
   * @param data - Data or result to be logged
   * @param config - Optional configuration for debug mode and event emission
   * 
   * @example
   * ```typescript
   * MyAgent.logExecution("MyAgent", "taskCompleted", {
   *   task: "data analysis",
   *   result: "success"
   * }, config);
   * ```
   */
  protected static logExecution(agentName: string, operation: string, data: any, config?: Record<string, any>): void {
    const isDebug = config?.configurable?.debug || false;
    const emitter = config?.configurable?.eventEmitter || null;
    if (isDebug) { // Debugging condition to prevent logging in production
      console.log(`[${agentName}] (${operation}):`, data);
    }
    if (emitter && typeof emitter.emit === 'function') {
      // general logging event
      emitter.emit("agent:log", {
        agent: agentName,
        operation,
        sessionId: config?.configurable?.sessionId,
        data,
      });
      // specific operation event
      emitter.emit(`${operation}`, {
        agent: agentName,
        operation,
        sessionId: config?.configurable?.sessionId,
        data
      });
    }
  }

  /**
   * Base execute method that must be implemented by all agent subclasses.
   * This method defines the agent's core logic and how it processes inputs to produce outputs.
   * 
   * @param input - Agent state input containing objective, tasks, and current context
   * @param config - Execution configuration with LLM credentials, session data, and tools
   * @returns Promise resolving to partial state updates
   * @throws {Error} When called on the base class instead of a subclass implementation
   * 
   * @example
   * ```typescript
   * static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
   *   const state = input as AgentState;
   *   // Implement agent logic here
   *   const result = await this.callLLM(prompt, config);
   *   return this.updateActionResults(state, result);
   * }
   * ```
   */
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    throw new Error(`${this.name}.execute() must be implemented by subclass`);
  }
}