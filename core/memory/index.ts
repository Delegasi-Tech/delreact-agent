// Export all memory-related types for external use
export * from "./types";

// Export concrete storage implementations
export { InMemoryStorage } from "./inMemory";
export { PostgresStorage } from "./postgres";
export { RedisStorage } from "./redis";

// Export factory and convenience functions
export { StorageFactory, createMemory } from "./factory";

// Re-export commonly used types for convenience
export type { ToolStorage, StorageConfig, StorageType } from "./types"; 