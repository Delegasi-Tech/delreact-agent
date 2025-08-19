export interface AgentEventPayload {
  agent: string;
  operation: string;
  sessionId?: string;
  data?: any;
}

export interface AgentEventEmitter {
  on(event: string, handler: (payload: AgentEventPayload) => void): void;
  off(event: string, handler: (payload: AgentEventPayload) => void): void;
}

export class EventEmitter implements AgentEventEmitter {
  private listeners: Record<string, Array<(payload: AgentEventPayload) => void>> = {};
  
  on(event: string, handler: (payload: AgentEventPayload) => void) {
    (this.listeners[event] ||= []).push(handler);
  }
  
  off(event: string, handler: (payload: AgentEventPayload) => void) {
    this.listeners[event] = (this.listeners[event] || []).filter(h => h !== handler);
  }
  
  emit(event: string, payload: AgentEventPayload) {
    const safePayload = JSON.parse(JSON.stringify(payload));
    (this.listeners[event] || []).forEach(h => h(safePayload));
  }
}