// src/core/agents.ts
import { AgentState } from "./agentState";
import { BaseAgent } from "./BaseAgent";
import { BaseActionAgent } from "./BaseActionAgent";

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
 * Format document information for inclusion in agent prompts
 * @param state Agent state containing documents
 * @returns Formatted document context string
 */
const formatDocumentContext = (state: AgentState): string => {
  if (!state.documents || state.documents.length === 0) {
    return "";
  }

  const documentInfo = state.documents.map(doc => {
    const preview = Array.isArray(doc.data) && doc.data.length > 0 
      ? doc.data.slice(0, 3).map(row => 
          typeof row === 'object' ? Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ') : row
        ).join('\n')
      : 'No data preview available';
    
    return `
📄 **Document**: ${doc.filePath}
   Type: ${doc.fileType}
   Rows: ${doc.metadata.rowCount}
   Columns: ${doc.metadata.columns.join(', ')}
   ${doc.metadata.sheetName ? `Sheet: ${doc.metadata.sheetName}` : ''}
   
   Preview (first 3 rows):
   ${preview}`;
  }).join('\n\n');

  return `
**📁 Available Document Files:**
${documentInfo}

The above documents have been loaded and their data is available for analysis. You can reference this data in your tasks and analysis.
`;
};

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
        const response = await EnhancePromptAgent.callLLM(enhancePrompt, config, undefined, state.images);
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

export class TaskBreakdownAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;

    const maxTasks = (config?.configurable?.maxTasks) ? config.configurable.maxTasks : 5; // Limit to 5 tasks
    const { hasRagVectors } = getRagConfigAndPresence(config);
    const ragGuidance = hasRagVectors
      ? `
        If the tasks require factual, document-grounded answers, include an early task to consult the local document corpus using the ragSearch tool (retrieve relevant passages first, then synthesize). Prefer grounded retrieval before free-form reasoning.`
      : "";
    
    const documentContext = formatDocumentContext(state);
    
    if (state.tasks.length === 0) {
      const breakdownPrompt = `
        Break down this objective into a semicolon-separated list of tasks, using as few tasks as necessary to achieve the objective, but no more than ${maxTasks} tasks in total.
        Do not artificially split into exactly ${maxTasks} if fewer are sufficient.
        Always end the list with a summarize task "[summarize]".
        Only return the list in semicolon, do not answer or explain.
        
        Objective: "${state.objective}"
        ${ragGuidance}
        
        ${documentContext}
      `;
      
      const breakdown = await TaskBreakdownAgent.callLLM(breakdownPrompt, config, undefined, state.images);
      const tasks = breakdown.split(";").map(t => t.trim()).filter(Boolean);
      
      TaskBreakdownAgent.logExecution("TaskBreakdownAgent", "taskBreakdown", {
        objective: state.objective,
        tasks: tasks,
        documentsCount: state.documents?.length || 0
      }, config);
      
      return { ...state, tasks, currentTaskIndex: 0, agentPhaseHistory: [...state.agentPhaseHistory, "TaskBreakdownAgent"] };
    }
    return state;
  }
}

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
      
      const replan = await TaskReplanningAgent.callLLM(replanPrompt, config, undefined, state.images);
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

export class ActionAgent extends BaseActionAgent {
  protected static readonly agentRole = 'final' as const;
  
  static execute: (input: unknown, config: Record<string, any>) => Promise<Partial<AgentState>> = BaseActionAgent.createExecute(ActionAgent);
  
  protected static async processTask(
    state: AgentState, 
    currentTask: string, 
    config: Record<string, any>
  ): Promise<string> {
    const documentContext = formatDocumentContext(state);
    
    const taskPrompt = `You will only answer specific task/question in short and compact manner to achieve objective "${state.objective}".
      
      ${documentContext}
      
      Complete and answer the following task: "${currentTask}"`;
    
    return await ActionAgent.callLLM(
      taskPrompt,
      config,
      ActionAgent.getObservabilityHeaders('action', state),
      state.images
    );
  }
  
  protected static processFinalResult(state: AgentState, result: string): Partial<AgentState> {
    return ActionAgent.updateActionResults(state, result);
  }
}

export class CompletionAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    
    // Use custom output format if provided, otherwise use default
    const formatInstruction = state.outputInstruction 
      ? state.outputInstruction
      : "**Follow intended format from Objective**.";
    
    const documentContext = formatDocumentContext(state);
    
    const summaryPrompt = `
      Summarize the following results for the user:
${state.actionResults.join("\n")} , to achieve the objective: "${state.objective}"

      ${documentContext}

      Output Format Rules:
${formatInstruction}

      If you cannot summarize, then return "No summary available".
    `;
    
    const conclusion = await CompletionAgent.callLLM(summaryPrompt, config, undefined, state.images);
    
    CompletionAgent.logExecution("CompletionAgent", "summaryCompleted", {
      objective: state.objective,
      actionTasks: state.actionedTasks,
      actionResults: state.actionResults,
      documentsCount: state.documents?.length || 0
    }, config);
    
    return { ...state, conclusion, objectiveAchieved: true, agentPhaseHistory: [...state.agentPhaseHistory, "CompletionAgent"]};
  }
}