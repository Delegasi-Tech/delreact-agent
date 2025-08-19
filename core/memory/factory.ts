import { ToolStorage, StorageConfig } from "./types";
import { InMemoryStorage } from "./inMemory";
import { PostgresStorage } from "./postgres";
import { RedisStorage } from "./redis";

export class StorageFactory {
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

  static createDefault(): ToolStorage {
    return new InMemoryStorage();
  }

  static validateConfig(config: StorageConfig): boolean {
    if (!config.type) return false;
    
    if ((config.type === "postgresql" || config.type === "redis") && !config.connectionString) {
      console.warn(`${config.type} storage typically requires connectionString`);
    }
    
    return true;
  }
} 

export function createMemory(config: StorageConfig): ToolStorage {
  return StorageFactory.create(config);
} 