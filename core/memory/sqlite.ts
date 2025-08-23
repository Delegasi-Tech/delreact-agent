import { ToolStorage, SessionStorage, StorageType, SessionMemory } from "./types";
import * as fs from "fs";
import * as path from "path";

// Simple SQLite implementation using file system and JSON
export class SQLiteStorage implements ToolStorage, SessionStorage {
  private dbPath: string;
  private sessionsPath: string;

  constructor(connectionString?: string) {
    const dbDir = connectionString || path.join(process.cwd(), '.delreact-memory');
    
    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = path.join(dbDir, 'tools.json');
    this.sessionsPath = path.join(dbDir, 'sessions.json');
    
    // Initialize files if they don't exist
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, '{}');
    }
    if (!fs.existsSync(this.sessionsPath)) {
      fs.writeFileSync(this.sessionsPath, '{}');
    }
  }

  getStorageType(): StorageType {
    return "sqlite";
  }

  generateReference(toolName: string, sessionId: string): string {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return `@sqlite::${encodeURIComponent(toolName)}::${encodeURIComponent(sessionId)}::${uniqueId}`;
  }

  async store(toolName: string, sessionId: string, toolResult: any): Promise<string> {
    const reference = this.generateReference(toolName, sessionId);
    
    try {
      const data = fs.existsSync(this.dbPath) ? JSON.parse(fs.readFileSync(this.dbPath, 'utf8')) : {};
      data[reference] = {
        toolResult,
        timestamp: Date.now(),
        toolName,
        sessionId
      };
      
      fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
      console.log(`[SQLite] Stored ${reference} (${typeof toolResult}, ${JSON.stringify(toolResult).length} chars)`);
      return reference;
    } catch (error) {
      console.error(`[SQLite] Failed to store ${reference}:`, error);
      throw error;
    }
  }

  async retrieve(reference: string): Promise<any | null> {
    try {
      const data = fs.existsSync(this.dbPath) ? JSON.parse(fs.readFileSync(this.dbPath, 'utf8')) : {};
      const result = data[reference]?.toolResult || null;
      console.log(`[SQLite] Retrieved ${reference}: ${result ? 'found' : 'not found'}`);
      return result;
    } catch (error) {
      console.error(`[SQLite] Failed to retrieve ${reference}:`, error);
      return null;
    }
  }

  async storeSession(sessionMemory: SessionMemory): Promise<void> {
    try {
      const sessions = fs.existsSync(this.sessionsPath) ? JSON.parse(fs.readFileSync(this.sessionsPath, 'utf8')) : {};
      sessions[sessionMemory.sessionId] = {
        ...sessionMemory,
        lastUpdated: Date.now()
      };
      
      fs.writeFileSync(this.sessionsPath, JSON.stringify(sessions, null, 2));
      console.log(`[SQLite] Session stored: ${sessionMemory.sessionId}`);
    } catch (error) {
      console.error(`[SQLite] Failed to store session ${sessionMemory.sessionId}:`, error);
      throw error;
    }
  }

  async retrieveSession(sessionId: string): Promise<SessionMemory | null> {
    try {
      const sessions = fs.existsSync(this.sessionsPath) ? JSON.parse(fs.readFileSync(this.sessionsPath, 'utf8')) : {};
      const session = sessions[sessionId] || null;
      console.log(`[SQLite] Session retrieved: ${sessionId} - ${session ? 'found' : 'not found'}`);
      return session;
    } catch (error) {
      console.error(`[SQLite] Failed to retrieve session ${sessionId}:`, error);
      return null;
    }
  }

  // Debug methods
  getStorageSize(): number {
    try {
      const data = fs.existsSync(this.dbPath) ? JSON.parse(fs.readFileSync(this.dbPath, 'utf8')) : {};
      return Object.keys(data).length;
    } catch {
      return 0;
    }
  }

  getAllReferences(): string[] {
    try {
      const data = fs.existsSync(this.dbPath) ? JSON.parse(fs.readFileSync(this.dbPath, 'utf8')) : {};
      return Object.keys(data);
    } catch {
      return [];
    }
  }

  clear(): void {
    try {
      fs.writeFileSync(this.dbPath, '{}');
      fs.writeFileSync(this.sessionsPath, '{}');
    } catch (error) {
      console.error('[SQLite] Failed to clear storage:', error);
    }
  }

  getBySession(sessionId: string): string[] {
    try {
      const data = fs.existsSync(this.dbPath) ? JSON.parse(fs.readFileSync(this.dbPath, 'utf8')) : {};
      return Object.keys(data).filter(ref => data[ref].sessionId === sessionId);
    } catch {
      return [];
    }
  }
}