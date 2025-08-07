// src/core/agents.ts
import { AgentState } from "./agentState";
import { BaseAgent } from "./BaseAgent";
import { BaseActionAgent } from "./BaseActionAgent";

export class EnhancePromptAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    
    if (state.tasks.length === 0) {
      const enhancePrompt = `You are an assistant that help users to enhance their prompt so that the prompt is more clear and concise. Every response must follow this exact format:

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
          EnhancePromptAgent.logExecution("EnhancePromptAgent", "Enhancing Prompt", {
            enhancedPrompt: finalEnhancementMatch[1].trim(),
            response,
          });
          newPrompt = finalEnhancementMatch[1].trim();
        } else {
          // Fallback: return the full response if parsing fails
          newPrompt = response;
        }
        EnhancePromptAgent.logExecution("EnhancePromptAgent", "Final Enhancement", {
          objective: state.objective,
          newPrompt
        });
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
    
    if (state.tasks.length === 0) {
      const breakdownPrompt = `
        Break down this objective into a comma-separated list of tasks, with a maximum of 5 tasks,
        ending it with a summarize task "[summarize]".
        Only return the list in comma, do not answer or explain.
        Objective: "${state.objective}"
      `;
      
      const breakdown = await TaskBreakdownAgent.callLLM(breakdownPrompt, config);
      const tasks = breakdown.split(",").map(t => t.trim()).filter(Boolean);
      
      TaskBreakdownAgent.logExecution("TaskBreakdownAgent", "Task breakdown", {
        objective: state.objective,
        tasks: tasks.map((t, i) => `${i + 1}. ${t}`).join("\n")
      });
      
      return { ...state, tasks, currentTaskIndex: 0 };
    }
    return state;
  }
}

export class TaskReplanningAgent extends BaseAgent {
  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    TaskReplanningAgent.logExecution("TaskReplanningAgent", "Current State", {
      objective: state.objective,
      availableTasks: state.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n"),
      actionedTasks: state.actionedTasks,
      actionResults: state.actionResults.join("\n"),
    });
    const currentTask = TaskReplanningAgent.getCurrentTask(state);
    
    // Priority 1 & 2: Handle completion scenarios (existing summarize task OR objective achieved)
    const hasSummarizeTask = currentTask && currentTask.toLowerCase().includes("summarize");
    
    if (hasSummarizeTask || state.objectiveAchieved) {
      if (hasSummarizeTask) {
        // Already has summarize task - pass through
        TaskReplanningAgent.logExecution("TaskReplanningAgent", "Summarize task detected", {
          task: currentTask,
          action: "passing through to completion"
        });
        return state;
      } else {
        // Objective achieved but no summarize task - add it
        const tasks = [...state.tasks];
        tasks.push("[summarize]");
        TaskReplanningAgent.logExecution("TaskReplanningAgent", "Adding summarize task", {
          reason: "Objective achieved but no summarize task found",
          addedTask: "[summarize]",
          currentIndex: state.currentTaskIndex
        });
        return { ...state, tasks, currentTaskIndex: tasks.length - 1 };
      }
    }
    
    // Priority 3: Normal replanning logic
    if (state.tasks.length > 1 && currentTask && !currentTask.toLowerCase().includes("summarize")) {
      const replanPrompt = `
        The user has requested to replan the tasks for the objective "${state.objective}". Previously, done tasks were: ${state.actionedTasks.join(", ")}. Your current plan: ${state.tasks.join(", ")} and your current task now: ${currentTask}.
        Your current action answered results are: ${state.actionResults.join(", ")}.

        I want you to update plan accordingly. If no more steps/tasks are needed and you can return to the user, then respond with a summarize task "[summarize]". Otherwise, adjust out the comma-separated list of tasks.
        Remove tasks before current task and only add task to the plan that still NEED to be done. Do not return previously done tasks as part of the plan. Only return the replanned task list in comma, do not answer or explain.
      `;
      
      const replan = await TaskReplanningAgent.callLLM(replanPrompt, config);
      const tasks = replan.split(",").map(t => t.trim()).filter(Boolean);
      
      TaskReplanningAgent.logExecution("TaskReplanningAgent", "Task Replan", {
        actionedTasks: state.actionedTasks.join("\n"),
        previousTasks: state.tasks.map((t, i) => `${i + 1}. ${t}`).join("\n"),
        newTasks: tasks.map((t, i) => `${i + 1}. ${t}`).join("\n"),
      });
      
      return { ...state, tasks, currentTaskIndex: 0 };
    }
    
    return state;
  }
}

export class ActionAgent extends BaseActionAgent {
  protected static readonly agentRole = 'final' as const;
  
  static execute = BaseActionAgent.createExecute(ActionAgent);
  
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
    
    const summaryPrompt = `
      Summarize the following results for the user:
${state.actionResults.join("\n")} , to achieve the objective: "${state.objective}"

      Output Format Rules:
${formatInstruction}

      If you cannot summarize, then return "No summary available".
    `;
    
    const conclusion = await CompletionAgent.callLLM(summaryPrompt, config);
    
    CompletionAgent.logExecution("CompletionAgent", "Summary Completed", {
      objective: state.objective,
      actionTasks: state.actionedTasks.map((t, i) => `${i + 1}. ${t}`).join("\n"),
      actionResults: state.actionResults.join("\n"),
    });
    
    return { ...state, conclusion, objectiveAchieved: true };
  }
}