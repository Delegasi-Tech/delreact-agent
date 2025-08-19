/** Payload type for agent lifecycle events */
export type AgentEventPayload = Record<string, any>;

/**
 * Interface for agent event emission and handling.
 * Provides a contract for event-driven communication in agent workflows.
 */
export interface AgentEventEmitter {
  /** Subscribe to an event with a handler function */
  on(event: string, handler: (payload: AgentEventPayload) => void): void;
  /** Unsubscribe from an event */
  off(event: string, handler: (payload: AgentEventPayload) => void): void;
  /** Emit an event with payload data */
  emit(event: string, payload: AgentEventPayload): void;
}

/**
 * Simple event emitter for agent lifecycle events and observability.
 * Enables monitoring and logging of agent execution phases, tool usage, and errors.
 * Provides thread-safe event handling with payload deep cloning.
 * 
 * @example
 * ```typescript
 * const emitter = new EventEmitter();
 * 
 * // Subscribe to agent events
 * emitter.on("agent:log", (payload) => {
 *   console.log(`Agent ${payload.agent} performed ${payload.operation}`);
 * });
 * 
 * // Emit events from agents
 * emitter.emit("agent:log", {
 *   agent: "TaskBreakdownAgent",
 *   operation: "taskBreakdown",
 *   data: { tasks: ["task1", "task2"] }
 * });
 * ```
 */
export class EventEmitter implements AgentEventEmitter {
  private listeners: Record<string, Array<(payload: AgentEventPayload) => void>> = {};
  
  /**
   * Subscribe to an event with a handler function.
   * 
   * @param event - Event name to listen for
   * @param handler - Function to call when event is emitted
   */
  on(event: string, handler: (payload: AgentEventPayload) => void) {
    (this.listeners[event] ||= []).push(handler);
  }
  
  /**
   * Unsubscribe from an event.
   * 
   * @param event - Event name to stop listening for
   * @param handler - Handler function to remove
   */
  off(event: string, handler: (payload: AgentEventPayload) => void) {
    this.listeners[event] = (this.listeners[event] || []).filter(h => h !== handler);
  }
  
  /**
   * Emit an event with payload data.
   * Creates a deep clone of the payload to ensure thread safety.
   * 
   * @param event - Event name to emit
   * @param payload - Data to send to event handlers
   */
  emit(event: string, payload: AgentEventPayload) {
    const safePayload = JSON.parse(JSON.stringify(payload));
    (this.listeners[event] || []).forEach(h => h(safePayload));
  }
}