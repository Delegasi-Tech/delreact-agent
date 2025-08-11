// Export all tools
export { fetchPageToMarkdownToolDef } from './fetchPageToMarkdown';
export { webSearchToolDef } from './webSearch';
export { ragToolDef } from './rag';

// Export registry
export { ToolRegistry, toolRegistry, ToolExecutionContext } from './registry';

// Import tools for auto-registration
import { fetchPageToMarkdownToolDef } from './fetchPageToMarkdown';
import { webSearchToolDef } from './webSearch';
import { ragToolDef } from './rag';
import { toolRegistry } from './registry';

export const DEFAULT_TOOLS = [
  fetchPageToMarkdownToolDef,
  webSearchToolDef,
  ragToolDef,
] as const;

function registerDefaultTools() {
  console.log("🔧 Registering default tools...");
  DEFAULT_TOOLS.forEach(tool => toolRegistry.register({
    tool,
    isAvailable: tool.name === 'web-search' 
      ? (context) => !!(context?.agentConfig?.braveApiKey)
      : () => true
  }));
  console.log(`✅ Registered ${DEFAULT_TOOLS.length} default tools`);
}

// Register RAG tool separately to avoid circular dependency issues
export function registerRAGTool() {
  try {
    toolRegistry.register({
      tool: ragToolDef,
      isAvailable: () => true, // Always available - works with or without OpenAI key
    });
    console.log("✅ RAG tool registered successfully");
  } catch (error) {
    console.warn("⚠️ Failed to register RAG tool:", error);
  }
}

registerDefaultTools();
registerRAGTool();

export function addTool(tool: any) {
  toolRegistry.register(tool);
}
