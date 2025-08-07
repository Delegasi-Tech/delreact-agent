// Export all tools
export { fetchPageToMarkdownToolDef } from './fetchPageToMarkdown';
export { webSearchToolDef } from './webSearch';
export { enhancePromptToolDef } from './promptEnhancement';

// Export registry
export { ToolRegistry, toolRegistry, ToolExecutionContext } from './registry';

// Import tools for auto-registration
import { fetchPageToMarkdownToolDef } from './fetchPageToMarkdown';
import { webSearchToolDef } from './webSearch';
import { enhancePromptToolDef } from './promptEnhancement';
import { toolRegistry } from './registry';

export const DEFAULT_TOOLS = [
  fetchPageToMarkdownToolDef,
  webSearchToolDef,
  enhancePromptToolDef,
] as const;

function registerDefaultTools() {
  console.log("🔧 Registering default tools...");
  DEFAULT_TOOLS.forEach(tool => toolRegistry.register(tool));
  console.log(`✅ Registered ${DEFAULT_TOOLS.length} default tools`);
}

registerDefaultTools();

export function addTool(tool: any) {
  toolRegistry.register(tool);
}
