// Example demonstrating how custom workflows can now use AgentState
import { AgentState, AgentStateChannels } from '../core';

// Example 1: Custom workflow function that accepts AgentState
function customWorkflowStep(state: AgentState): Partial<AgentState> {
  console.log('Processing state for objective:', state.objective);
  
  // Example custom logic that extends the state
  return {
    ...state,
    agentPhaseHistory: [...state.agentPhaseHistory, 'custom-workflow-step'],
    actionResults: [...state.actionResults, 'Custom workflow result']
  };
}

// Example 2: Creating a custom state configuration using AgentStateChannels
function createCustomStateChannels() {
  // Access the existing state channel configuration
  console.log('Available state channels:', Object.keys(AgentStateChannels));
  
  // Custom workflows can now extend or modify state channels
  return {
    ...AgentStateChannels,
    // Add custom channels if needed
    customField: {
      value: (x?: string, y?: string) => y ?? x ?? "default",
      default: () => "default"
    }
  };
}

// Example 3: Type-safe state manipulation
function validateAgentState(state: AgentState): boolean {
  return (
    typeof state.objective === 'string' &&
    Array.isArray(state.tasks) &&
    typeof state.currentTaskIndex === 'number' &&
    typeof state.objectiveAchieved === 'boolean'
  );
}

console.log('✅ AgentState successfully exported and usable in custom workflows!');
console.log('Custom workflows can now:');
console.log('  - Use AgentState type for type-safe state handling');
console.log('  - Access AgentStateChannels for state configuration');
console.log('  - Extend agent state with custom logic');