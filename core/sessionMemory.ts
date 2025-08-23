// src/core/sessionMemory.ts
import { SessionMemory } from "./agentState";
import { SessionStorage } from "./memory/types";

export class SessionMemoryManager {
  private storage: SessionStorage;

  constructor(storage: SessionStorage) {
    this.storage = storage;
  }

  /**
   * Load existing session memory or create new one
   */
  async loadOrCreateSession(sessionId: string): Promise<SessionMemory> {
    const existingSession = await this.storage.retrieveSession(sessionId);
    
    if (existingSession) {
      console.log(`🧠 Loaded existing session memory for: ${sessionId}`);
      return existingSession;
    }

    console.log(`🆕 Creating new session memory for: ${sessionId}`);
    const newSession: SessionMemory = {
      sessionId,
      previousConclusions: [],
      conversationHistory: [],
      lastUpdated: Date.now()
    };

    await this.storage.storeSession(newSession);
    return newSession;
  }

  /**
   * Update session memory with new conversation entry
   */
  async updateSession(
    sessionId: string, 
    objective: string, 
    conclusion: string, 
    keyResults?: string[]
  ): Promise<SessionMemory> {
    const session = await this.loadOrCreateSession(sessionId);

    // Add new conversation entry
    const conversationEntry = {
      objective,
      conclusion,
      timestamp: Date.now(),
      keyResults
    };

    session.conversationHistory.push(conversationEntry);
    
    // Update previous conclusions (keep last 5)
    session.previousConclusions.push(conclusion);
    if (session.previousConclusions.length > 5) {
      session.previousConclusions = session.previousConclusions.slice(-5);
    }

    // Keep conversation history manageable (last 10 entries)
    if (session.conversationHistory.length > 10) {
      session.conversationHistory = session.conversationHistory.slice(-10);
    }

    session.lastUpdated = Date.now();
    await this.storage.storeSession(session);

    console.log(`🔄 Updated session memory for: ${sessionId}`);
    return session;
  }

  /**
   * Generate context string from session memory for prompt inclusion
   */
  generateSessionContext(session: SessionMemory): string {
    if (!session || session.conversationHistory.length === 0) {
      return "";
    }

    const recentHistory = session.conversationHistory.slice(-3); // Last 3 conversations
    
    let context = "\n\n## Session Memory Context\n";
    context += "Based on our previous conversations:\n\n";

    recentHistory.forEach((entry, index) => {
      const timeAgo = this.formatTimeAgo(entry.timestamp);
      context += `**Previous Objective (${timeAgo})**: ${entry.objective}\n`;
      context += `**Result**: ${this.truncateText(entry.conclusion, 200)}\n`;
      
      if (entry.keyResults && entry.keyResults.length > 0) {
        context += `**Key Results**: ${entry.keyResults.slice(0, 2).join(", ")}\n`;
      }
      context += "\n";
    });

    context += "Please consider this context when working on the current objective.\n";
    return context;
  }

  /**
   * Get summary of previous conclusions for context
   */
  getPreviousConclusionsSummary(session: SessionMemory): string {
    if (!session || session.previousConclusions.length === 0) {
      return "";
    }

    const recent = session.previousConclusions.slice(-3);
    return `Previous conclusions: ${recent.map(c => this.truncateText(c, 100)).join(" | ")}`;
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return "just now";
  }
}