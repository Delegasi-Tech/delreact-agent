import { ToolStorage, SessionStorage, StorageType, SessionMemory } from "./types";

// Global storage map shared across all instances
const globalStorage: Map<string, any> = new Map();
const globalSessions: Map<string, SessionMemory> = new Map();

export class InMemoryStorage implements ToolStorage, SessionStorage {
  private storage: Map<string, any> = globalStorage; // Use global storage
  private sessions: Map<string, SessionMemory> = globalSessions; // Use global sessions
  
  getStorageType(): StorageType {
    return "in-memory";
  }

  generateReference(toolName: string, sessionId: string): string {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return `@in-memory::${encodeURIComponent(toolName)}::${encodeURIComponent(sessionId)}::${uniqueId}`;
  }

  async store(toolName: string, sessionId: string, toolResult: any): Promise<string> {
    const reference = this.generateReference(toolName, sessionId);
    this.storage.set(reference, toolResult);
    console.log(`[InMemory] Stored ${reference} (${typeof toolResult}, ${JSON.stringify(toolResult).length} chars)`);
    return reference;
  }

  async retrieve(reference: string): Promise<any | null> {
    const result = this.storage.get(reference) || null;
    console.log(`[InMemory] Retrieved ${reference}: ${result ? 'found' : 'not found'}`);
    return result;
  }

  async storeSession(sessionMemory: SessionMemory): Promise<void> {
    this.sessions.set(sessionMemory.sessionId, {
      ...sessionMemory,
      lastUpdated: Date.now()
    });
    console.log(`[InMemory] Session stored: ${sessionMemory.sessionId}`);
  }

  async retrieveSession(sessionId: string): Promise<SessionMemory | null> {
    const session = this.sessions.get(sessionId) || null;
    console.log(`[InMemory] Session retrieved: ${sessionId} - ${session ? 'found' : 'not found'}`);
    return session;
  }

  // Debug methods
  getStorageSize(): number {
    return this.storage.size;
  }

  getAllReferences(): string[] {
    return Array.from(this.storage.keys());
  }

  clear(): void {
    this.storage.clear();
    this.sessions.clear();
  }

  getBySession(sessionId: string): string[] {
    return this.getAllReferences().filter(ref => ref.includes(`_${sessionId}_`));
  }
} 