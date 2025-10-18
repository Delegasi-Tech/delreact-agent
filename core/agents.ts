// src/core/agents.ts
import { AgentState } from "./agentState";
import { BaseAgent } from "./BaseAgent";
import { BaseActionAgent } from "./BaseActionAgent";
import { 
  DEFAULT_PROMPTS, 
  executePrompt, 
  TaskBreakdownParams, 
  TaskReplanningParams,
  ActionAgentParams,
  SummarizerAgentParams,
  EnhancePromptParams,
  AgentPrompts 
} from './prompt';

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


// Helper function to get custom prompt or default
function getPrompt<T>(
  config: Record<string, any>,
  agentType: keyof AgentPrompts
): string | ((params: T) => string) {
  const customPrompts = config?.configurable?.agentConfig?.prompts as AgentPrompts;
  const prompt = customPrompts?.[agentType] || DEFAULT_PROMPTS[agentType];
  return prompt as (string | ((params: T) => string));
}

export class EnhancePromptAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    
    if (state.tasks.length === 0) {
      // Get session context if available
      const sessionContext = config?.configurable?.sessionContext || "";
      
      const promptTemplate = getPrompt<EnhancePromptParams>(config, 'enhancePrompt');
      
      const promptParams: EnhancePromptParams = {
        objective: state.objective,
        sessionContext: sessionContext,
        documentContext: formatDocumentContext(state),
        state: state,
        config: config
      };

      const enhancePrompt = executePrompt(promptTemplate, promptParams);
      
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
    const sessionContext = config?.configurable?.sessionContext || "";
    
    if (state.tasks.length === 0) {
      // Get custom prompt or use default
      const promptTemplate = getPrompt<TaskBreakdownParams>(config, 'taskBreakdown');
      
      // Prepare parameters for the prompt function
      const promptParams: TaskBreakdownParams = {
        objective: state.objective,
        maxTasks: maxTasks,
        ragGuidance: ragGuidance,
        sessionContext: sessionContext,
        documentContext: documentContext,
        state: state,
        config: config
      };
      
      // Execute the prompt (string or function)
      const breakdownPrompt = executePrompt(promptTemplate, promptParams);
      
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
      // Get custom prompt or use default
      const promptTemplate = getPrompt<TaskReplanningParams>(config, 'taskReplanning');
      
      // Prepare parameters for the prompt function
      const promptParams: TaskReplanningParams = {
        objective: state.objective,
        actionedTasks: state.actionedTasks,
        currentTasks: state.tasks,
        actionResults: state.actionResults,
        ragGuidance: ragGuidance,
        sessionContext: config?.configurable?.sessionContext || "",
        documentContext: formatDocumentContext(state),
        state: state,
        config: config
      };
      
      // Execute the prompt (string or function)
      const replanPrompt = executePrompt(promptTemplate, promptParams);
      
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
    
    // Get custom prompt or use default
    const promptTemplate = getPrompt<ActionAgentParams>(config, 'actionAgent');
    
    // Prepare parameters for the prompt function
    const promptParams: ActionAgentParams = {
      objective: state.objective,
      currentTask: currentTask,
      sessionContext: config?.configurable?.sessionContext || "",
      documentContext: documentContext,
      state: state,
      config: config
    };
    
    // Execute the prompt (string or function)
    const taskPrompt = executePrompt(promptTemplate, promptParams);

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
    
    // Get custom prompt or use default
    const promptTemplate = getPrompt<SummarizerAgentParams>(config, 'summarizerAgent');
    
    // Prepare parameters for the prompt function
    const promptParams: SummarizerAgentParams = {
      objective: state.objective,
      actionResults: state.actionResults,
      formatInstruction: formatInstruction,
      sessionContext: config?.configurable?.sessionContext || "",
      documentContext: documentContext,
      state: state,
      config: config
    };
    
    // Execute the prompt (string or function)
    const summaryPrompt = executePrompt(promptTemplate, promptParams);
    
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