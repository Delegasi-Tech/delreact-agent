// Export all tools
export { fetchPageToMarkdownToolDef } from './fetchPageToMarkdown';
export { webSearchToolDef } from './webSearch';
export { enhancePromptToolDef } from './promptEnhancement';
export { fileReaderToolDef } from './fileReader';

// Export registry
export { ToolRegistry, toolRegistry, ToolExecutionContext } from './registry';

// Import tools for auto-registration
import { toolRegistry } from './registry';

export const DEFAULT_TOOLS = [
  'fetchPageToMarkdown',
  'webSearch',
  'promptEnhancement',
  'fileReader',
] as const;

function registerDefaultTools() {
  console.log("🔧 Registering default tools...");
  // Tools are registered by their individual modules when imported
  console.log(`✅ Default tools registration initialized`);
}

registerDefaultTools();

export function addTool(tool: any) {
  toolRegistry.register(tool);
}
