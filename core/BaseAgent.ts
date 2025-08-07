// src/core/BaseAgent.ts
import { AgentState } from "./agentState";
import { llmCall } from "./llm";
import { toolRegistry } from "./tools/registry";

/**
 * Abstract base class for all agents in the LGraph framework
 * Provides common utilities and enforces consistent agent patterns
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
    const tools = toolRegistry.createToolsWithConfig(agentConfig);

    // Log tools being used and availability status
    this.logExecution(this.name, "Available tools", tools.map(t => t.name));
    this.logExecution(this.name, "Tool availability status", toolRegistry.getToolAvailabilityStatus({ agentConfig }));

    return llmCall(prompt, {
      provider: config?.configurable?.selectedProvider,
      apiKey: config?.configurable?.selectedKey,
      heliconeKey: config?.configurable?.heliconeKey, // Pass helicone key
      sessionId: config?.configurable?.sessionId,
      memory: config?.configurable?.memory, // Pass memory context for smart retrieval
      enableToolSummary: config?.configurable?.enableToolSummary,
      maxTokens: config?.configurable?.maxTokens,
      temperature: config?.configurable?.temperature,
      model: config?.configurable?.model,
      tools: tools,
      addHeaders: {
        "Helicone-Session-Id": config?.configurable?.sessionId,
        "Helicone-Session-Path": `/run-agent/${this.name}`,
        "Helicone-Session-Name": `AgentGraph: ${this.name}`,
        ...additionalHeaders
      }
    });
  }

  /**
   * Get the current task from agent state
   */
  protected static getCurrentTask(state: AgentState): string {
    const task = state.tasks[state.currentTaskIndex];
    return task || "";
  }

  /**
   * Update action results and move to next task
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
      currentTaskIndex: state.currentTaskIndex + 1
    };
  }

  /**
   * Standardized logging for agent execution
   */
  protected static logExecution(agentName: string, operation: string, data: any): void {
    console.log(`[${agentName}] ${operation}:`, data);
  }

  /**
   * Base execute method - override in subclasses
   * @param input - Agent state input
   * @param config - Execution configuration with LLM credentials and session data
   * @returns Partial state updates
   */
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    throw new Error(`${this.name}.execute() must be implemented by subclass`);
  }
}
