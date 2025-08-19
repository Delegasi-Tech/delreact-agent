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

/**
 * Default tools available in the DelReact framework.
 * These tools are automatically registered and available to all agents.
 */
export const DEFAULT_TOOLS = [
  fetchPageToMarkdownToolDef,
  webSearchToolDef,
  enhancePromptToolDef,
] as const;

/**
 * Register all default tools with the tool registry.
 * Called automatically when the tools module is imported.
 * @private
 */
function registerDefaultTools() {
  console.log("🔧 Registering default tools...");
  DEFAULT_TOOLS.forEach(tool => toolRegistry.register(tool));
  console.log(`✅ Registered ${DEFAULT_TOOLS.length} default tools`);
}

registerDefaultTools();

/**
 * Add a custom tool to the global tool registry.
 * Makes the tool available to all agents in the framework.
 * 
 * @param tool - Tool definition to register
 * 
 * @example
 * ```typescript
 * import { addTool, createAgentTool } from "delreact-agent";
 * 
 * const customTool = createAgentTool({
 *   name: "my-tool",
 *   description: "Does something useful",
 *   schema: { input: { type: "string", description: "Input data" } },
 *   run: async ({ input }) => `Processed: ${input}`
 * });
 * 
 * addTool(customTool);
 * ```
 */
export function addTool(tool: any) {
  toolRegistry.register(tool);
}
