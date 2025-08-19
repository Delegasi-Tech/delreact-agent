/**
 * Core state structure for DelReact agent workflows.
 * Tracks the complete execution context including objectives, tasks, results, and progress.
 * All agents operate on this shared state, enabling coordinated multi-agent workflows.
 */
export type AgentState = {
  /** The main objective or goal that the agent workflow should accomplish */
  objective: string;
  /** The current prompt being processed (may be enhanced from objective) */
  prompt: string;
  /** Optional instructions for formatting the final output */
  outputInstruction?: string;
  /** Array of tasks to be executed in sequence */
  tasks: string[];
  /** Index of the currently executing task */
  currentTaskIndex: number;
  /** Results from completed tasks */
  actionResults: string[];
  /** List of tasks that have been completed */
  actionedTasks: string[];
  /** Result from the most recently completed task */
  lastActionResult?: string;
  /** Whether the main objective has been achieved */
  objectiveAchieved: boolean;
  /** Final conclusion when the workflow is complete */
  conclusion?: string;
  /** History of which agents have executed during the workflow */
  agentPhaseHistory: string[];
};

/**
 * LangGraph channel definitions for agent state management.
 * Defines how state properties are updated and merged during workflow execution.
 * Each channel specifies value merge logic and default values.
 */
export const AgentStateChannels: StateGraphArgs<AgentState>["channels"] = {
  objective: {
    value: (x?: string, y?: string) => y ?? x ?? "",
    default: () => "",
  },
  prompt: {
    value: (x?: string, y?: string) => y ?? x ?? "",
    default: () => "",
  },
  outputInstruction: {
    value: (x?: string, y?: string) => y ?? x ?? "",
    default: () => "",
  },
  tasks: {
    value: (x: string[] = [], y: string[] = []) => y.length ? y : x,
    default: () => [],
  },
  currentTaskIndex: {
    value: (x = 0, y = 0) => y ?? x,
    default: () => 0,
  },
  actionResults: {
    value: (x: string[] = [], y: string[] = []) => y.length ? y : x,
    default: () => [],
  },
  actionedTasks: {
    value: (x: string[] = [], y: string[] = []) => y.length ? y : x,
    default: () => [],
  },
  lastActionResult: {
    value: (x?: string, y?: string) => y ?? x,
    default: () => undefined,
  },
  objectiveAchieved: {
    value: (x = false, y = false) => y ?? x,
    default: () => false,
  },
  conclusion: {
    value: (x?: string, y?: string) => y ?? x,
    default: () => undefined,
  },
  agentPhaseHistory: {
    value: (x: string[] = [], y: string[] = []) => y.length ? y : x,
    default: () => [],
  },
};

// BaseAgentGraph method: init, addStartAgent, addEndAgent, addRouteAgent(agent1, agent2), compile
