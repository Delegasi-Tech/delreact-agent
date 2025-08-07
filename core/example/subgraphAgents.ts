// src/subgraphAgents.ts
import { AgentState } from "../agentState";
import { BaseActionAgent } from "../BaseActionAgent";

/**
 * Research Agent - First step in action subgraph
 * Focuses on gathering information for the current task
 */
export class ResearchAgent extends BaseActionAgent {
  protected static readonly agentRole = 'flow' as const;
  
  static execute = BaseActionAgent.createExecute(ResearchAgent);
  
  protected static async processTask(
    state: AgentState, 
    currentTask: string, 
    config: Record<string, any>
  ): Promise<string> {
    const researchPrompt = `
      You are a research specialist. Your task is to gather comprehensive information and context.
      
      Objective: "${state.objective}"
      Current Task: "${currentTask}"
      Previous Results: ${state.actionResults.join(", ") || "None"}
      
      Conduct thorough research on this task. Focus on:
      1. Key facts, context and data points
      2. Different perspectives or approaches
      
      Provide detailed research findings that will inform the next analysis step.
    `;

    return await ResearchAgent.callLLM(
      researchPrompt,
      config,
      ResearchAgent.getObservabilityHeaders('research', state)
    );
  }
  
  // MANDATORY for flow agents - adds memory key to processing pipeline
  protected static processFlowResult(state: AgentState, result: string, memoryKey?: string): Partial<AgentState> {
    // The actual result is stored in memory by BaseActionAgent.storeAgentResult
    // Here we just add a reference to the memory key
    const key = memoryKey || '@in-memory_ResearchAgent_result';
    return {
      actionResults: [...state.actionResults, `[RESEARCH] ${key}`]
    };
  }
}

/**
 * Analysis Agent - Second step in action subgraph  
 * Analyzes research findings and creates structured insights
 */
export class AnalysisAgent extends BaseActionAgent {
  protected static readonly agentRole = 'flow' as const;
  
  static execute = BaseActionAgent.createExecute(AnalysisAgent);
  
  protected static async processTask(
    state: AgentState, 
    currentTask: string, 
    config: Record<string, any>
  ): Promise<string> {
    // Get the latest research result for context
    const researchResults = state.actionResults.filter(result => result.startsWith("[RESEARCH]"));
    const latestResearch = researchResults[researchResults.length - 1]?.replace("[RESEARCH] ", "") || "";

    const analysisPrompt = `
      You are an analysis specialist. Analyze the research findings and create structured insights.
      
      Objective: "${state.objective}"
      Current Task: "${currentTask}"
      Research Findings: "${latestResearch}"
      Output Instruction: ${state.outputInstruction || "Structured analysis"}
      
      Based on the research findings, provide:
      1. Key insights and patterns
      2. Structured analysis with clear conclusions
      
      Create a comprehensive analysis that directly addresses the task.
    `;

    return await AnalysisAgent.callLLM(
      analysisPrompt,
      config,
      AnalysisAgent.getObservabilityHeaders('analysis', state)
    );
  }
  
  // MANDATORY for flow agents - adds memory key to processing pipeline
  protected static processFlowResult(state: AgentState, result: string, memoryKey?: string): Partial<AgentState> {
    // The actual result is stored in memory by BaseActionAgent.storeAgentResult
    // Here we just add a reference to the memory key
    const key = memoryKey || '@in-memory_AnalysisAgent_result';
    return {
      actionResults: [...state.actionResults, `[ANALYSIS] ${key}`]
    };
  }
}

/**
 * Synthesis Agent - Final step in action subgraph
 * Combines research and analysis into final actionable result
 */
export class SynthesisAgent extends BaseActionAgent {
  protected static readonly agentRole = 'final' as const;
  
  static execute = BaseActionAgent.createExecute(SynthesisAgent);
  
  protected static async processTask(
    state: AgentState, 
    currentTask: string, 
    config: Record<string, any>
  ): Promise<string> {
    // Extract research and analysis results for synthesis
    const researchResults = state.actionResults.filter(result => result.startsWith("[RESEARCH]"));
    const analysisResults = state.actionResults.filter(result => result.startsWith("[ANALYSIS]"));
    
    const latestResearch = researchResults[researchResults.length - 1]?.replace("[RESEARCH] ", "") || "";
    const latestAnalysis = analysisResults[analysisResults.length - 1]?.replace("[ANALYSIS] ", "") || "";

    const synthesisPrompt = `
      You are a synthesis specialist. Combine research and analysis into a final, actionable result.
      
      Objective: "${state.objective}"
      Current Task: "${currentTask}"
      Research: "${latestResearch}"
      Analysis: "${latestAnalysis}"
      Output Instruction: ${state.outputInstruction || "Clear, actionable result"}

      Synthesize the research and analysis into:
      1. Clear, direct answer to the task
      2. Concise summary
      
      Provide the final result that directly completes the assigned task.
    `;

    return await SynthesisAgent.callLLM(
      synthesisPrompt,
      config,
      SynthesisAgent.getObservabilityHeaders('synthesis', state)
    );
  }
  
  protected static processFinalResult(state: AgentState, result: string): Partial<AgentState> {
    return SynthesisAgent.updateActionResults(state, result);
  }
}

export class HonestAgent extends BaseActionAgent {
  protected static readonly agentRole = 'final' as const;
  
  static execute = BaseActionAgent.createExecute(HonestAgent);
  
  protected static async processTask(
    state: AgentState, 
    currentTask: string, 
    config: Record<string, any>
  ): Promise<string> {
    const synthesisPrompt = `
      You are an honest specialist. Answer blatantly and directly without any fluff and show tradeoffs.

      Objective: "${state.objective}"
      Current Task: "${currentTask}"
      Output Instruction: ${state.outputInstruction || "Clear, actionable result"}

      Answer the objective directly and honestly, focusing on:
      1. Whats The Answer
      2. What is missing and tradeoffs
      
      Provide the final result that directly completes the assigned task.
    `;

    return await HonestAgent.callLLM(
      synthesisPrompt,
      config,
      HonestAgent.getObservabilityHeaders('honest', state)
    );
  }
  
  protected static processFinalResult(state: AgentState, result: string): Partial<AgentState> {
    return HonestAgent.updateActionResults(state, result);
  }
}
