// src/core/agents.ts
import { AgentState } from "./agentState";
import { BaseAgent } from "./BaseAgent";
import { BaseActionAgent } from "./BaseActionAgent";

/**
 * Extracts RAG config and checks if any RAG vectors are present in config.
 * @param config Agent config object
 * @returns { ragCfg, hasRagVectors }
 */
const getRagConfigAndPresence = (config: Record<string, any>): {
  ragCfg: { vectorFiles?: string[]; vectorFile?: string } | undefined;
  hasRagVectors: boolean;
} => {
  const ragCfg = (config?.configurable?.rag ?? config?.configurable?.agentConfig?.rag) as { vectorFiles?: string[]; vectorFile?: string } | undefined;
  const hasRagVectors = Array.isArray(ragCfg?.vectorFiles)
    ? !!ragCfg && ragCfg.vectorFiles!.length > 0
    : typeof ragCfg?.vectorFile === "string";
  return { ragCfg, hasRagVectors };
};

/**
 * Agent responsible for enhancing user prompts to improve clarity and effectiveness
 */
export class EnhancePromptAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    
    if (state.tasks.length === 0) {
      // NOTES: change the prompt to enhance so that it can be more clear and concise
      const enhancePrompt = `You are an assistant that help users to enhance their prompt so that the prompt is more clear and concise. Respond use this format:

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

      **User's Prompt:** ${state.objective}

      Please enhance the above prompt using the structured 3-part format.`;
      
      let newPrompt = state.objective; // Fallback to original objective
      try {
        // Call the LLM to enhance the prompt
        const response = await EnhancePromptAgent.callLLM(enhancePrompt, config);
        const finalEnhancementMatch = response.match(/<final_enhancement>([\s\S]*?)<\/final_enhancement>/);
        if (finalEnhancementMatch && finalEnhancementMatch[1]) {
          EnhancePromptAgent.logExecution("EnhancePromptAgent", "enhancingPrompt", {
            enhancedPrompt: finalEnhancementMatch[1].trim(),
            response,
          }, config);
          newPrompt = finalEnhancementMatch[1].trim();
        } else {
          // Fallback: return the full response if parsing fails
          newPrompt = response;
        }
        EnhancePromptAgent.logExecution("EnhancePromptAgent", "finalEnhancement", {
          objective: state.objective,
          newPrompt
        }, config);
      } catch (error) {
        console.error("Error enhancing prompt:", error);
        newPrompt = state.objective; // Fallback to original objective
      }
      
      return { ...state, prompt: newPrompt, objective: newPrompt };
    }
    return state;
  }
}

/**
 * Agent responsible for breaking down complex objectives into manageable, sequential tasks
 */
export class TaskBreakdownAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;

    const maxTasks = (config?.configurable?.maxTasks) ? config.configurable.maxTasks : 5; // Limit to 5 tasks
    const { hasRagVectors } = getRagConfigAndPresence(config);
    const ragGuidance = hasRagVectors
      ? `
        If the tasks require factual, document-grounded answers, include an early task to consult the local document corpus using the ragSearch tool (retrieve relevant passages first, then synthesize). Prefer grounded retrieval before free-form reasoning.`
      : "";
    if (state.tasks.length === 0) {
      const breakdownPrompt = `
        Break down this objective into a semicolon-separated list of tasks, using as few tasks as necessary to achieve the objective, but no more than ${maxTasks} tasks in total.
        Do not artificially split into exactly ${maxTasks} if fewer are sufficient.
        Always end the list with a summarize task "[summarize]".
        Only return the list in semicolon, do not answer or explain.
        Objective: "${state.objective}"
        ${ragGuidance}
      `;
      
      const breakdown = await TaskBreakdownAgent.callLLM(breakdownPrompt, config);
      const tasks = breakdown.split(";").map(t => t.trim()).filter(Boolean);
      
      TaskBreakdownAgent.logExecution("TaskBreakdownAgent", "taskBreakdown", {
        objective: state.objective,
        tasks: tasks
      }, config);
      
      return { ...state, tasks, currentTaskIndex: 0, agentPhaseHistory: [...state.agentPhaseHistory, "TaskBreakdownAgent"] };
    }
    return state;
  }
}

/**
 * Agent responsible for evaluating progress and adaptively replanning the task sequence
 */
export class TaskReplanningAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    TaskReplanningAgent.logExecution("TaskReplanningAgent", "evaluateState", {
      objective: state.objective,
      availableTasks: state.tasks,
      actionedTasks: state.actionedTasks,
      actionResults: state.actionResults,
    }, config);
    const currentTask = TaskReplanningAgent.getCurrentTask(state);
    const { hasRagVectors } = getRagConfigAndPresence(config);
    const ragGuidance = hasRagVectors
      ? `
        If the objective benefits from local documents, ensure the plan includes a retrieval step using the ragSearch tool before answering/summarizing. Keep retrieval steps only when still necessary; avoid repeating already completed retrieval.`
      : "";
    
    // Priority 1 & 2: Handle completion scenarios (existing summarize task OR objective achieved)
    const hasSummarizeTask = currentTask && currentTask.toLowerCase().includes("summarize");
    
    if (hasSummarizeTask || state.objectiveAchieved) {
      if (hasSummarizeTask) {
        // Already has summarize task - pass through
        TaskReplanningAgent.logExecution("TaskReplanningAgent", "summarizeTaskDetected", {
          task: currentTask,
          action: "passing through to completion"
        }, config);
        return { ...state, agentPhaseHistory: [...state.agentPhaseHistory, "TaskReplanningAgent"] };
      } else {
        // Objective achieved but no summarize task - add it
        const tasks = [...state.tasks];
        tasks.push("[summarize]");
        TaskReplanningAgent.logExecution("TaskReplanningAgent", "addingSummarizeTask", {
          reason: "Objective achieved but no summarize task found",
          addedTask: "[summarize]",
          currentIndex: state.currentTaskIndex
        }, config);
        return { ...state, tasks, currentTaskIndex: tasks.length - 1, agentPhaseHistory: [...state.agentPhaseHistory, "TaskReplanningAgent"] };
      }
    }
    
    // Priority 3: Normal replanning logic
    if (state.tasks.length > 1 && currentTask && !currentTask.toLowerCase().includes("summarize")) {
      const replanPrompt = `
        The user has requested to replan the tasks for the objective "${state.objective}".
        
        Previously completed tasks: ${state.actionedTasks.join(", ")}
        Current plan: ${state.tasks.join(", ")}
        Recent action results: ${state.actionResults.join(", ")}
        ${ragGuidance}

        Analyze the above action results and, if needed, create a new and improved sequence of tasks to achieve the objective.
        Do not limit yourself to only changing, reordering, or removing the current set—be creative and generate new tasks or a new plan if new findings, requirements, or subtasks are discovered.
          - Remove tasks that are already completed or no longer needed.
          - Add new tasks or alter existing tasks if new subtasks or requirements are discovered.
          - Reorder or reprioritize tasks if necessary.
          - If all tasks are complete or the objective already achieved from results, return only the summarize task "[summarize]".
        The new plan should reflect the latest context and insights, not just incremental changes.

        Return only the updated tasks in a semicolon-separated list of tasks that still need to be done, in order. Do not include any explanation or previously completed tasks.
      `;
      
      const replan = await TaskReplanningAgent.callLLM(replanPrompt, config);
      const tasks = replan.split(";").map(t => t.trim()).filter(Boolean);
      
      TaskReplanningAgent.logExecution("TaskReplanningAgent", "taskReplan", {
        actionedTasks: state.actionedTasks,
        previousTasks: state.tasks,
        newTasks: tasks,
      }, config);
      
      return { ...state, tasks, currentTaskIndex: 0, agentPhaseHistory: [...state.agentPhaseHistory, "TaskReplanningAgent"] };
    }
    
    return state;
  }
}

/**
 * Default action agent that executes individual tasks with tool access
 */
export class ActionAgent extends BaseActionAgent {
  protected static readonly agentRole = 'final' as const;
  
  static execute: (input: unknown, config: Record<string, any>) => Promise<Partial<AgentState>> = BaseActionAgent.createExecute(ActionAgent);
  
  /**
   * Process an individual task with LLM and return the result.
   * Override from BaseActionAgent to provide task-specific processing logic.
   * 
   * @param state - Current agent state with objective context
   * @param currentTask - The specific task to execute
   * @param config - Execution configuration with LLM and tool settings
   * @returns Promise resolving to the task execution result
   */
  protected static async processTask(
    state: AgentState, 
    currentTask: string, 
    config: Record<string, any>
  ): Promise<string> {
    return await ActionAgent.callLLM(
      `You will only answer specific task/question in short and compact manner to achieve objective "${state.objective}".
      Complete and answer the following task: "${currentTask}"`,
      config,
      ActionAgent.getObservabilityHeaders('action', state)
    );
  }
  
  /**
   * Process the final result and update agent state.
   * Override from BaseActionAgent to handle result integration.
   * 
   * @param state - Current agent state
   * @param result - Result from task execution
   * @returns Partial state update with new action results
   */
  protected static processFinalResult(state: AgentState, result: string): Partial<AgentState> {
    return ActionAgent.updateActionResults(state, result);
  }
}

/**
 * Agent responsible for synthesizing all action results into a final conclusion
 */
export class CompletionAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    
    // Use custom output format if provided, otherwise use default
    const formatInstruction = state.outputInstruction 
      ? state.outputInstruction
      : "**Follow intended format from Objective**.";
    
    const summaryPrompt = `
      Summarize the following results for the user:
${state.actionResults.join("\n")} , to achieve the objective: "${state.objective}"

      Output Format Rules:
${formatInstruction}

      If you cannot summarize, then return "No summary available".
    `;
    
    const conclusion = await CompletionAgent.callLLM(summaryPrompt, config);
    
    CompletionAgent.logExecution("CompletionAgent", "summaryCompleted", {
      objective: state.objective,
      actionTasks: state.actionedTasks,
      actionResults: state.actionResults,
    }, config);
    
    return { ...state, conclusion, objectiveAchieved: true, agentPhaseHistory: [...state.agentPhaseHistory, "CompletionAgent"]};
  }
}