import { tool } from "@langchain/core/tools";
import z from "zod";

/**
 * Input interface for web search operations.
 */
export interface WebSearchInput {
  /** Search query string */
  query: string;
  /** Agent configuration containing API keys */
  agentConfig?: {
    /** Brave Search API key for web search functionality */
    braveApiKey?: string;
  };
}

/**
 * Perform web search using Brave Search API.
 * Searches the web for current information and returns formatted results.
 * 
 * @param params - Search parameters including query and configuration
 * @returns Promise resolving to array of search results with title, URL, and snippet
 * @throws {Error} When Brave API key is not provided
 * 
 * @example
 * ```typescript
 * const results = await webSearchTool({
 *   query: "latest AI developments 2024",
 *   agentConfig: { braveApiKey: "your-brave-api-key" }
 * });
 * ```
 */
const webSearchTool = async ({ query, agentConfig }: WebSearchInput): Promise<{ title: string; url: string; snippet: string }[]> => {
  console.log("[query]", `"${query}"`);
  // console.log("[agentConfig]", agentConfig);
  const apiKey = agentConfig?.braveApiKey;
  if (!apiKey) throw new Error("BRAVE_API_KEY not provided in agent config");
  try {
    const res = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": apiKey,
      },
    });
    if (!res.ok) throw new Error(`Brave API error: ${res.status}`);
    const data = await res.json();

    console.log("[query results]", data.web.results.length, "results found");

    if (!data.web || !Array.isArray(data.web.results)) return [];
    return data.web.results.map((item: any) => ({
      title: item.title,
      url: item.url,
      snippet: item.description || item.snippet || ""
    }));
  } catch (e) {
    console.error("Brave web search error:", e);
    return [];
  }
};

/**
 * LangChain tool definition for web search functionality.
 * Provides agents with the ability to search the web for current information using Brave Search API.
 * Automatically formats results as JSON string for LLM consumption.
 * 
 * @example
 * ```typescript
 * // Used automatically when braveApiKey is configured
 * const result = await webSearchToolDef.invoke({
 *   query: "current weather in Tokyo",
 *   agentConfig: { braveApiKey: "your-key" }
 * });
 * ```
 */
export const webSearchToolDef = tool(
  async ({ query, agentConfig }: { query: string; agentConfig?: any }): Promise<string> => {
    const result = await webSearchTool({ query, agentConfig });

    return `Search results for ${query}: ${JSON.stringify(result)}`
  },
  {
    name: "web-search",
    description: "Use this tool whenever the user asks for latest, up-to-date, factual, or external information that requires searching the internet.",
    schema: z.object({
      query: z.string(),
      agentConfig: z.object({
        braveApiKey: z.string().optional()
      }).optional(),
    }),
  }
); 