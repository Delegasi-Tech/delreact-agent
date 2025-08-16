import { AgentConfig, AgentContext } from "./agentConfig";
import { AgentState } from "./agentState";
import { BaseActionAgent } from "./BaseActionAgent";
import { LlmCallOptions } from "./llm";

/**
 * Extracts RAG config and checks if any RAG vectors are present in config.
 * @param config Agent config object
 * @returns { ragCfg, hasRagVectors }
 */
const getRagConfigAndPresence = (config: Record<string, any>): {
    ragCfg: { vectorFiles?: string[]; vectorFile?: string } | undefined;
    hasRagVectors: boolean;
  } => {
    const ragCfg = config?.configurable?.agentConfig?.rag as { vectorFiles?: string[]; vectorFile?: string } | undefined;
    const hasRagVectors = (ragCfg?.vectorFiles?.length ?? 0) > 0 || typeof ragCfg?.vectorFile === "string";
  
    return { ragCfg, hasRagVectors };
  };

/**
 * Creates a dynamic agent class from configuration with clean 3-phase workflow execution.
 * Each agent executes: Plan → Process → Validate
 * 
 * @param config The agent configuration object
 * @returns A new class that extends BaseActionAgent with proper task tracking
 */

export type CustomAgent = typeof BaseActionAgent & {
    invoke(objective: string | { objective: string; outputInstruction?: string }, config?: Record<string, any>): Promise<{ result: string; plannedTask: string }>;
};

export function createCustomAgentClass(config: AgentConfig): CustomAgent {
    const agentClassName = config.name;

    const AgentClass = {
        [agentClassName]: class extends BaseActionAgent {
            protected static readonly agentRole = 'flow';
            public static readonly agentName = agentClassName;
            public static readonly agentConfig = config;

            /**
             * Builds contextual prompt for agent based on workflow position and state
             * Uses configurable memory settings for optimal context management
             */
            private static buildAgentContextPrompt(
                state: AgentState,
            ): string {
                // Get memory settings with scientifically calibrated defaults
                const memorySettings = {
                    rememberLastSteps: config.memory?.rememberLastSteps ?? 3,
                    maxTextPerStep: config.memory?.maxTextPerStep ?? 120,
                    includeWorkflowSummary: config.memory?.includeWorkflowSummary ?? true
                };

                // Validate inputs
                if (!state?.objective) {
                    return `${config.description} for: "No objective provided"`;
                }

                const isFirstAgent = !state.actionResults || state.actionResults.length === 0;
                
                if (isFirstAgent) {
                    // First agent: Focus on the primary objective
                    return `${config.description} regarding: "${state.objective.trim()}"`;
                }

                // Subsequent agents: Include workflow context with validation
                const previousResult = this.getPreviousResult(state);
                const workflowContext = memorySettings.includeWorkflowSummary 
                    ? this.buildWorkflowContext(state, memorySettings)
                    : '';
                
                if (!previousResult || previousResult.trim() === '') {
                    // Fallback if previous result is empty
                    return `${config.description} continuing workflow for: "${state.objective.trim()}"`;
                }

                // Truncate very long results to prevent token overflow
                const truncatedResult = this.truncateText(previousResult, memorySettings.maxTextPerStep);
                
                return workflowContext.length > 0 
                    ? `${config.description} based on workflow progress:\n${workflowContext}\n\nMost recent result: "${truncatedResult}"`
                    : `${config.description} based on previous result: "${truncatedResult}"`;
            }

            /**
             * Helper: Get the previous result for the agent, using lastActionResult or last actionResults entry
             */
            private static getPreviousResult(state: AgentState): string | null {
                if (state.lastActionResult && typeof state.lastActionResult === 'string') {
                    return state.lastActionResult;
                }
                if (Array.isArray(state.actionResults) && state.actionResults.length > 0) {
                    return state.actionResults[state.actionResults.length - 1];
                }
                return null;
            }

            /**
             * Helper: Build concise workflow context from agent history
             */
            private static buildWorkflowContext(state: AgentState, memorySettings: { rememberLastSteps: number; maxTextPerStep: number }): string {
                if (!state.agentPhaseHistory || state.agentPhaseHistory.length <= 1) {
                    return '';
                }

                // Show configurable number of recent workflow steps for context
                const recentSteps = Math.min(memorySettings.rememberLastSteps, state.agentPhaseHistory.length);
                const contextSteps = state.agentPhaseHistory
                    .slice(-recentSteps)
                    .map((agent, index) => {
                        const resultIndex = state.actionResults.length - recentSteps + index;
                        const result = state.actionResults[resultIndex];
                        if (!result) return null;
                        
                        const truncated = this.truncateText(result, Math.floor(memorySettings.maxTextPerStep * 0.8)); // Slightly smaller for workflow context
                        return `${agent}: ${truncated}`;
                    })
                    .filter(Boolean)
                    .join('\n');

                return contextSteps ? `Objective: ${state.objective.trim()}\nWorkflow:\n${contextSteps}` : '';
            }

            /**
             * Helper: Safely truncate text with ellipsis
             */
            private static truncateText(text: string, maxLength: number): string {
                if (!text || typeof text !== 'string') return 'Invalid content';
                
                const cleaned = text.trim();
                return cleaned.length > maxLength 
                    ? `${cleaned.substring(0, maxLength)}...` 
                    : cleaned;
            }

            /**
             * Creates the context object passed to all custom agent methods.
             */

            private static createAgentContext(
                state: AgentState,
                currentTask: string,
                execConfig: Record<string, any>
            ): AgentContext {
                return {
                    state,
                    task: currentTask,
                    config: execConfig,
                    callLLM: async (prompt: string, options?: LlmCallOptions): Promise<string> => {
                        const llmOptions = {
                            ...options,
                            selectedProvider: options?.provider || config.provider,
                            selectedKey: options?.apiKey || config.apiKey, 
                            model: options?.model || config.model,
                            maxTokens: options?.maxTokens || config.maxTokens,
                        }

                        return this.callLLM(prompt, { ...execConfig, configurable: { ...execConfig.configurable, ...llmOptions } });
                    },
                    getAgentContext: async (maxResults?: number): Promise<string> => {
                        // This function can be expanded to retrieve context from memory or other sources.
                        return JSON.stringify({
                            objective: state.objective,
                            previousTasks: state.actionedTasks,
                            previousResults: state.actionResults.slice(-(maxResults || 5)),
                        });
                    }
                }
            }

            /**
             * Executes the planning phase. Uses the custom `planTask` function from the
             * config if provided, otherwise falls back to a default planner.
            */
            private static async plan(ctx: AgentContext): Promise<{ canExecute: boolean, plan: string, reason?: string }> {
                if (config.planTask) {
                    return config.planTask(ctx);
                }

                // Default planning logic
                try {
                    // Use the task from context (which is the agent-specific task we created)
                    const taskToProcess = ctx.task || ctx.state.tasks[ctx.state.currentTaskIndex] || ctx.state.objective;

                    const prompt = `
                    Given the overall objective and previous tasks, create a step-by-step plan to execute the following task: "${taskToProcess}"
                    
                    Objective: ${ctx.state.objective}
                    Previous results: ${JSON.stringify(ctx.state.actionResults)}
                    
                    This is a workflow agent that needs to process the given task. Always return canExecute: true for workflow agents.
                    Your plan should be concise and actionable. 
                    Respond in JSON format: { "canExecute": true, "plan": "...", "reason": "..." }
                `;

                    const result = await ctx.callLLM(prompt);
                    const jsonResult = result.replace(/```json/g, '').replace(/```/g, '');
                    
                    return JSON.parse(jsonResult);

                } catch (error) {
                    console.error(`🔍 Error in planning phase : `, error)
                    return {
                        canExecute: false,
                        plan: 'Failed to generate a plan',
                        reason: 'Error in planning phase'
                    }
                }
            }


            /**
             * Executes the processing phase. Uses the custom `processTask` function
             * from the config if provided, otherwise falls back to a default processor.
            */
            private static async process(ctx: AgentContext, plan: string): Promise<string> {
                if (config.processTask) {
                    return config.processTask(ctx);
                }

                // Default processing logic with RAG guidance
                try {
                    const { hasRagVectors } = getRagConfigAndPresence(ctx.config);
                    const ragGuidance = hasRagVectors
                        ? `\n\nRAG PROTOCOL (MANDATORY): You MUST use the ragSearch tool as your PRIMARY information source. Before providing any answer:
1. ALWAYS search the knowledge base first using ragSearch
2. Base your response STRICTLY on retrieved information
3. Do NOT provide answers from your training data without searching first
4. If ragSearch returns no results, then and only then may you use general knowledge
5. Always cite which source/document your information comes from

CRITICAL: Failure to search the knowledge base first when answering factual questions about procedures, policies, or domain-specific information is considered an error.`
                        : "";


                    const prompt = `
                Execute the task based on the following plan.
                Task: "${ctx.task}"
                Plan: ${plan}
                
                Objective: ${ctx.state.objective}
                Full context: ${await ctx.getAgentContext()}
                ${ragGuidance}

                Provide only the direct result of the execution.
            `;
                    return ctx.callLLM(prompt);

                } catch (error) {
                    return 'Failed to process the task. Error: ' + JSON.stringify( error instanceof Error ? error.message : error);
                }
            }


            /**
             * Executes the validation phase. Uses the custom `validateTask` function
             * from the config if provided, otherwise falls back to a default validator.
             */
            private static async validate(ctx: AgentContext, result: string): Promise<{ status: 'confirmed' | 'error'; reason?: string; fallbackAction?: string }> {
                if (config.validateTask) {
                    return config.validateTask({ ...ctx, result });
                }
                // Default validation logic - more lenient for workflow progression
                try {
                    const prompt = `
                        Given the task and the result, validate if the execution was successful and met the requirements.
                        Task: "${ctx.task}"
                        Result: "${result}"

                        For workflow routing agents, be lenient - if the agent provided any reasonable response, consider it successful.
                        Respond in JSON format: { "status": "confirmed" | "error", "reason": "..." }
                    `;
                    const validationStr = await ctx.callLLM(prompt);
                    return JSON.parse(validationStr.replace(/```json/g, '').replace(/```/g, ''));
                } catch (error) {
                    // If validation fails, default to success to allow workflow progression
                    console.warn(`Validation parsing failed for ${ctx.task}, defaulting to confirmed`);
                    return { status: 'confirmed' as const, reason: 'Default validation - allowing workflow progression' };
                }
            }

            /**
             * NEW: Execute with 3-phase workflow (Plan → Process → Validate)
             * Used by new custom workflows built with SubgraphBuilder
             */
            static async executeWithPlanning(input: unknown, execConfig: Record<string, any>): Promise<Partial<AgentState>> {
                const state = input as AgentState;
                
                // Get initial context (objective for first agent, or continuation for subsequent)
                const originalTask = state.tasks[state.currentTaskIndex] || state.objective;
                                
                // Run 3-phase workflow: Plan → Process → Validate
                const {result, plannedTask} = await this.processTask(state, originalTask, execConfig);
                
                // Record the planned task (what the agent decided to do) and the result
                const stateUpdate = this.processFlowResult(state, result, plannedTask);
                
                return { ...state, ...stateUpdate };
            }

            /**
             * Records the task and result for this agent in the workflow
             */
            protected static processFlowResult(state: AgentState, result: string, plannedTask?: string): Partial<AgentState> {
                const taskToRecord = plannedTask || `${this.agentName}: ${config.description}`;
                
                return {
                    actionResults: [...state.actionResults, result],
                    lastActionResult: result,
                    actionedTasks: [...state.actionedTasks, taskToRecord],
                    currentTaskIndex: state.currentTaskIndex + 1,
                    agentPhaseHistory: [...(state.agentPhaseHistory || []), this.agentName]
                };
            }

            /**
             * Get the agent configuration (accessible from instance)
             */
            static getConfig(): AgentConfig {
                return config;
            }

            /**
             * Individual agent invoke method for standalone 3-phase execution
             * This allows agents to be run independently with: builder.createAgent({...}).invoke(objective)
             */
            static async invoke(
                objective: string | { objective: string; outputInstruction?: string },
                config?: Record<string, any>
            ): Promise<{ result: string; plannedTask: string }> {
                // Handle both string and object inputs
                const objectiveStr = typeof objective === 'string' ? objective : objective.objective;
                const outputInstruction = typeof objective === 'object' ? objective.outputInstruction : undefined;
                
                // Create initial state for individual agent execution
                const initialState: AgentState = {
                    objective: objectiveStr,
                    prompt: objectiveStr,
                    outputInstruction: outputInstruction || "",
                    tasks: [objectiveStr],
                    currentTaskIndex: 0,
                    actionResults: [],
                    actionedTasks: [],
                    objectiveAchieved: false,
                    conclusion: undefined,
                    agentPhaseHistory: [],
                };

                // Create execution config with agent-specific settings
                const execConfig = {
                    configurable: {
                        ...config?.configurable,
                        selectedProvider: config?.provider || config?.configurable?.selectedProvider || 'gemini',
                        selectedKey: config?.apiKey || config?.configurable?.selectedKey,
                        model: config?.model || config?.configurable?.model,
                        maxTokens: config?.maxTokens || config?.configurable?.maxTokens,
                        debug: config?.debug || config?.configurable?.debug || false,
                    }
                };

                this.logExecution(this.agentName, "Individual agent invoke started", {
                    objective: objectiveStr,
                }, execConfig);

                // Execute 3-phase workflow
                const result = await this.processTask(initialState, objectiveStr, execConfig);

                this.logExecution(this.agentName, "Individual agent invoke completed", {
                    result: result,
                }, execConfig);

                return { result: result.result, plannedTask: result.plannedTask };
            }



            /**
             * The main execution method for the agent.
             * It orchestrates the plan, process, and validate phases.
             */
            protected static async processTask(
                state: AgentState,
                currentTask: string,
                execConfig: Record<string, any>
            ): Promise<{ result: string; plannedTask: string }> {
                
                // Replace general agent config with agent-specific config
                const enhancedExecConfig = {
                    ...execConfig,
                    configurable: {
                        ...execConfig.configurable,
                        agentConfig: {
                            ...execConfig.configurable?.agentConfig,
                            ...config, // Include the agent's full config including RAG
                        }
                    }
                };
                                
                // 1. Build contextual prompt for planning
                const promptContext = this.buildAgentContextPrompt(state);
                const planContext = this.createAgentContext(state, promptContext, enhancedExecConfig);

                // 2. Plan Phase - creates the actual task
                this.logExecution(this.agentName, "taskPlanning", { promptContext }, enhancedExecConfig);
                const planResult = await this.plan(planContext);
                if (!planResult.canExecute) {
                    this.logExecution(this.agentName, "Planning determined task cannot be executed", { reason: planResult.reason }, enhancedExecConfig);
                    return { result: `Planning failed: ${planResult.reason || "No reason provided"}`, plannedTask: planResult.plan };
                }

                const plannedTask = planResult.plan; // This is the actual task to execute

                // 3. Create context with the planned task using enhanced config
                const processContext = this.createAgentContext(state, plannedTask, enhancedExecConfig);

                // 4. Process Phase - execute the planned task
                this.logExecution(this.agentName, "action", { plannedTask }, enhancedExecConfig);
                const processResult = await this.process(processContext, plannedTask);
                this.logExecution(this.agentName, "action", { result: processResult }, enhancedExecConfig);

                // 5. Validate Phase
                const validationResult = await this.validate(processContext, processResult);

                if (validationResult.status === 'error') {
                    this.logExecution(this.agentName, "validation failed", { reason: validationResult.reason }, enhancedExecConfig);
                    return { result: `Validation failed: ${validationResult.reason || "No reason provided"}`, plannedTask: plannedTask };
                }

                this.logExecution(this.agentName, "validation", { result: validationResult }, enhancedExecConfig);


                return { result: processResult, plannedTask: plannedTask };
            }
        }

    }[agentClassName];

    // Add the invoke method to the class itself
    (AgentClass as any).invoke = AgentClass.invoke.bind(AgentClass);

    return AgentClass as CustomAgent;
}