// src/core/BaseAgent.ts
import { AgentState } from "./agentState";
import { llmCall } from "./llm";
import { toolRegistry } from "./tools/registry";

/**
 * Abstract base class for all agents in the DelReact framework.
 * Provides common utilities and enforces consistent agent patterns.
 */
export abstract class BaseAgent {
  /**
   * Call LLM with standardized configuration and automatic tool injection
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

  protected static getCurrentTask(state: AgentState): string {
    const task = state.tasks[state.currentTaskIndex];
    return task || "";
  }

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
   * Base execute method that must be implemented by all agent subclasses
   */
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    throw new Error(`${this.name}.execute() must be implemented by subclass`);
  }
}