// Storage Types
export type StorageType = "in-memory" | "postgresql" | "redis";

// Tool Storage Interface
export interface ToolStorage {
  store(toolName: string, sessionId: string, toolResult: any): Promise<string>;
  retrieve(reference: string): Promise<any | null>;
  generateReference(toolName: string, sessionId: string): string;
  getStorageType(): StorageType;
}

// Storage Configuration
export interface StorageConfig {
  type: StorageType;
  connectionString?: string; // For PostgreSQL/Redis
  options?: Record<string, any>; // Additional config
} 