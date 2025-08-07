import { tool } from "@langchain/core/tools";
import z from "zod";

export interface WebSearchInput {
  query: string;
  agentConfig?: {
    braveApiKey?: string;
  };
}

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

    console.log("data", data.web.results);

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