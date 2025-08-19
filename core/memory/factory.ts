import { ToolStorage, StorageConfig } from "./types";
import { InMemoryStorage } from "./inMemory";
import { PostgresStorage } from "./postgres";
import { RedisStorage } from "./redis";

/**
 * Factory class for creating different types of memory storage instances.
 * Provides a unified interface for initializing in-memory, PostgreSQL, or Redis storage.
 */
export class StorageFactory {
  /**
   * Create a memory storage instance based on the provided configuration.
   * 
   * @param config - Storage configuration specifying type and connection details
   * @returns Configured storage instance implementing the ToolStorage interface
   * @throws {Error} When an unknown storage type is specified
   * 
   * @example
   * ```typescript
   * // Create in-memory storage
   * const memoryStorage = StorageFactory.create({ type: "in-memory" });
   * 
   * // Create PostgreSQL storage
   * const pgStorage = StorageFactory.create({
   *   type: "postgresql",
   *   connectionString: "postgresql://user:pass@localhost/db"
   * });
   * ```
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
   * Create a default in-memory storage instance.
   * Convenient method for quick setup without configuration.
   * 
   * @returns New InMemoryStorage instance
   * 
   * @example
   * ```typescript
   * const storage = StorageFactory.createDefault();
   * ```
   */
  static createDefault(): ToolStorage {
    return new InMemoryStorage();
  }

  /**
   * Validate storage configuration before creating an instance.
   * Checks for required fields and warns about common configuration issues.
   * 
   * @param config - Storage configuration to validate
   * @returns True if configuration is valid, false otherwise
   * 
   * @example
   * ```typescript
   * const config = { type: "postgresql", connectionString: "..." };
   * if (StorageFactory.validateConfig(config)) {
   *   const storage = StorageFactory.create(config);
   * }
   * ```
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