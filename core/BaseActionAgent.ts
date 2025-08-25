// src/core/BaseActionAgent.ts
import { AgentState } from "./agentState";
import { BaseAgent } from "./BaseAgent";

export abstract class BaseActionAgent extends BaseAgent {
  // Define agent role - must be overridden in subclasses
  protected static readonly agentRole: 'flow' | 'final';
  
  // Abstract method all action agents must implement - override in subclasses
  protected static async processTask(
    state: AgentState, 
    currentTask: string, 
    config: Record<string, any>
  ): Promise<string | { result: string; plannedTask: string }> {
    throw new Error(`${this.name}.processTask() must be implemented by subclass`);
  }
  
  // Flow agents MUST implement this - adds to processing pipeline
  protected static processFlowResult(
    state: AgentState, 
    result: string,
    memoryKey?: string
  ): Partial<AgentState> {
    if (this.agentRole !== 'flow') {
      throw new Error(`${this.name} called processFlowResult() but agentRole is '${this.agentRole}', should be 'flow'`);
    }
    throw new Error(`${this.name} has agentRole='flow' but processFlowResult() is not implemented`);
  }
  
  // Final agents MUST implement this - completes tasks (should include updateActionResults)
  protected static processFinalResult(
    state: AgentState, 
    result: string
  ): Partial<AgentState> {
    if (this.agentRole !== 'final') {
      throw new Error(`${this.name} called processFinalResult() but agentRole is '${this.agentRole}', should be 'final'`);
    }
    throw new Error(`${this.name} has agentRole='final' but processFinalResult() is not implemented`);
  }
  
  protected static getObservabilityHeaders(agentType: string, state: AgentState): Record<string, string> {
    const isSubgraph = this.agentRole === 'flow';
    const basePath = isSubgraph ? 'subgraph' : 'run-agent';
    
    return {
      "Helicone-Session-Path": `/${basePath}-${agentType}/${state.actionedTasks.length}`,
      "Helicone-Property-Agent": this.name,
      ...(isSubgraph && { "Helicone-Property-Subgraph": "ActionSubgraph" })
    };
  }

  protected static async storeAgentResult(
    agentName: string,
    result: string,
    task: string,
    config: Record<string, any>
  ): Promise<string> {
    const memory = config?.configurable?.memory;
    const sessionId = config?.configurable?.sessionId || 'default';
    
    if (!memory) {
      console.log(`⚠️ No memory available for ${agentName} - skipping result storage`);
      return '';
    }

    try {
      const memoryKey = await memory.store(agentName, sessionId, {
        result,
        task,
        timestamp: Date.now(),
        agentRole: 'flow'
      });

      console.log(`💾 ${agentName} result stored in memory: ${memoryKey}`);
      return memoryKey;
    } catch (error) {
      console.error(`❌ Failed to store ${agentName} result in memory:`, error);
      return '';
    }
  }


  
  protected static async executeTemplate(
    AgentClass: typeof BaseActionAgent,
    input: unknown, 
    config: Record<string, any>
  ): Promise<Partial<AgentState>> {
    const state = input as AgentState;
    const currentTask = BaseActionAgent.getCurrentTask(state);
    
    // Common early returns for all action agents
    if (!currentTask) {
      BaseActionAgent.logExecution(AgentClass.name, "No task available", { 
        currentTaskIndex: state.currentTaskIndex,
        totalTasks: state.tasks.length 
      }, config);
      return { ...state, objectiveAchieved: true };
    }
    
    if (currentTask.toLowerCase().includes("summarize")) {
      BaseActionAgent.logExecution(AgentClass.name, "summarizeTask:skip", { task: currentTask }, config);
      return state;
    }
    
    // Call processTask on the specific agent class 
    const result = await AgentClass.processTask(state, currentTask, config);
    
    // Handle result based on agent role
    if (AgentClass.agentRole === 'flow') {
      // Extract result string for memory storage
      const resultString = typeof result === 'string' ? result : result.result;
      
      // Store result in memory for cross-agent sharing
      const memoryKey = await BaseActionAgent.storeAgentResult(
        AgentClass.name, resultString, currentTask, config
      );
      
      const stateUpdate = AgentClass.processFlowResult(state, resultString, memoryKey);
      
      BaseActionAgent.logExecution(AgentClass.name, "flowCompleted", {
        objective: state.objective,
        task: currentTask,
        result: resultString,
        resultLength: resultString.length,
      }, config);
      
      return { ...state, ...stateUpdate };
      
    } else if (AgentClass.agentRole === 'final') {
      const resultString = typeof result === 'string' ? result : result.result;
      const stateUpdate = AgentClass.processFinalResult(state, resultString);
      
      BaseActionAgent.logExecution(AgentClass.name, "taskCompleted", {
        task: currentTask,
        result: resultString,
        resultLength: resultString.length,
      }, config);
      
      return { ...state, ...stateUpdate };
      
    } else {
      throw new Error(`${AgentClass.name} has invalid agentRole='${AgentClass.agentRole}'. Must be 'flow' or 'final'`);
    }
  }

  static async execute(input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> {
    throw new Error(`${this.name}.execute() must be implemented by subclass. Use BaseActionAgent.createExecute(YourClass) pattern.`);
  }

  protected static createExecute<T extends typeof BaseActionAgent>(AgentClass: T) {
    return async (input: unknown, config: Record<string, any>): Promise<Partial<AgentState>> => {
      return BaseActionAgent.executeTemplate(AgentClass, input, config);
    };
  }
}
