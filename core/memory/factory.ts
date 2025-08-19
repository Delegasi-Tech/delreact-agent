import { ToolStorage, StorageConfig } from "./types";
import { InMemoryStorage } from "./inMemory";
import { PostgresStorage } from "./postgres";
import { RedisStorage } from "./redis";

/**
 * Factory class for creating different types of memory storage instances
 */
export class StorageFactory {
  /**
   * Create a memory storage instance based on the provided configuration
   */
  static create(config: StorageConfig): ToolStorage {
    switch (config.type) {
      case "in-memory":
        return new InMemoryStorage();
      case "postgresql":
        return new PostgresStorage(config.connectionString);
      case "redis":
        return new RedisStorage(config.connectionString);
      default:
        throw new Error(`Unknown storage type: ${config.type}`);
    }
  }

  /**
   * Create a default in-memory storage instance
   */
  static createDefault(): ToolStorage {
    return new InMemoryStorage();
  }

  /**
   * Validate storage configuration before creating an instance
   */
  static validateConfig(config: StorageConfig): boolean {
    if (!config.type) return false;
    
    if ((config.type === "postgresql" || config.type === "redis") && !config.connectionString) {
      console.warn(`${config.type} storage typically requires connectionString`);
    }
    
    return true;
  }
} 

/**
 * Convenience function for creating memory storage instances.
 * Provides a simple functional interface as an alternative to the StorageFactory class.
 * 
 * @param config - Storage configuration specifying type and connection details
 * @returns Configured storage instance implementing the ToolStorage interface
 * 
 * @example
 * ```typescript
 * import { createMemory } from "delreact-agent";
 * 
 * const memory = createMemory({
 *   type: "redis",
 *   connectionString: "redis://localhost:6379"
 * });
 * ```
 */
export function createMemory(config: StorageConfig): ToolStorage {
  return StorageFactory.create(config);
} 