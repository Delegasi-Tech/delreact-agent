// src/core/agentState.ts
import { StateGraphArgs } from "@langchain/langgraph";

export type AgentState = {
  objective: string;
  prompt: string;
  outputInstruction?: string;
  images?: ProcessedImage[];
  documents?: ProcessedDocument[];
  tasks: string[];
  currentTaskIndex: number;
  actionResults: string[];
  actionedTasks: string[];
  lastActionResult?: string;
  objectiveAchieved: boolean;
  conclusion?: string;
  agentPhaseHistory: string[];
};

export interface ProcessedImage {
  url: string; // Base64 data URL
  detail?: 'auto' | 'low' | 'high';
}

export interface ProcessedDocument {
  filePath: string;
  fileType: 'csv' | 'excel';
  data: any; // Parsed document data
  metadata: {
    rowCount: number;
    columns: string[];
    sheetName?: string;
  };
}

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
  images: {
    value: (x: ProcessedImage[] = [], y: ProcessedImage[] = []) => y.length ? y : x,
    default: () => [],
  },
  documents: {
    value: (x: ProcessedDocument[] = [], y: ProcessedDocument[] = []) => y.length ? y : x,
    default: () => [],
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
