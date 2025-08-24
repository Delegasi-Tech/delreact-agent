// Storage Types
export type StorageType = "in-memory" | "postgresql" | "redis" | "sqlite";

// Session Memory interface
export interface SessionMemory {
  sessionId: string;
  previousConclusions: string[];
  conversationHistory: Array<{
    objective: string;
    conclusion: string;
    timestamp: number;
    keyResults?: string[];
  }>;
  lastUpdated: number;
}

// Tool Storage Interface
export interface ToolStorage {
  store(toolName: string, sessionId: string, toolResult: any): Promise<string>;
  retrieve(reference: string): Promise<any | null>;
  generateReference(toolName: string, sessionId: string): string;
  getStorageType(): StorageType;
}

// Session Storage Interface
export interface SessionStorage {
  storeSession(sessionMemory: SessionMemory): Promise<void>;
  retrieveSession(sessionId: string): Promise<SessionMemory | null>;
  getStorageType(): StorageType;
}

// Storage Configuration
export interface StorageConfig {
  type: StorageType;
  connectionString?: string; // For PostgreSQL/Redis/SQLite
  customPath?: string; // Custom directory path for SQLite storage (optional)
  options?: Record<string, any>; // Additional config
  enableSessionPersistence?: boolean; // Enable SQLite persistence for session memory
} 