import { ToolStorage, SessionStorage, StorageConfig } from "./types";
import { InMemoryStorage } from "./inMemory";
import { PostgresStorage } from "./postgres";
import { RedisStorage } from "./redis";
import { SQLiteStorage } from "./sqlite";

export class StorageFactory {
  static create(config: StorageConfig): ToolStorage & SessionStorage {
    switch (config.type) {
      case "in-memory":
        return new InMemoryStorage() as ToolStorage & SessionStorage;
      case "postgresql":
        return new PostgresStorage(config.connectionString) as ToolStorage & SessionStorage;
      case "redis":
        return new RedisStorage(config.connectionString) as ToolStorage & SessionStorage;
      case "sqlite":
        return new SQLiteStorage(config.connectionString, config.customPath);
      default:
        throw new Error(`Unknown storage type: ${config.type}`);
    }
  }

  static createDefault(): ToolStorage & SessionStorage {
    return new InMemoryStorage() as ToolStorage & SessionStorage;
  }

  static createWithSessionSupport(config: StorageConfig): ToolStorage & SessionStorage {
    // If session persistence is enabled, use SQLite regardless of base type
    if (config.enableSessionPersistence) {
      return new SQLiteStorage(config.connectionString, config.customPath);
    }
    return StorageFactory.create(config);
  }

  static validateConfig(config: StorageConfig): boolean {
    if (!config.type) return false;
    
    if ((config.type === "postgresql" || config.type === "redis") && !config.connectionString) {
      console.warn(`${config.type} storage typically requires connectionString`);
    }
    
    return true;
  }
} 

export function createMemory(config: StorageConfig): ToolStorage & SessionStorage {
  return StorageFactory.createWithSessionSupport(config);
} 