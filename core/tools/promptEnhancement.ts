// import { tool } from "@langchain/core/tools";
// import { ChatOpenAI } from "@langchain/openai";
// import { z } from "zod";

// export interface EnhancePromptInput {
//   prompt: string;
// }

// export const enhancePromptTool = async ({ 
//   prompt, 
// }: EnhancePromptInput): Promise<string> => {
//   const enhancedPrompt = `You are an assistant that help users to enhance their prompt so that the prompt is more clear and concise. Every response must follow this exact format:

// **Required Format:**
// \`\`\`
// <initial_enhancement>
// [Provide initial enhancement about user's prompt. This enhancement should be more clear and concise than the original prompt.]
// </initial_enhancement>

// <critique_initial_enhancement>
// [Analyze and critique the initial enhancement. Identify weaknesses, shortcomings, missed aspects, or areas that could be improved. Think critically about the initial enhancement.]
// </critique_initial_enhancement> 

// <final_enhancement>
// [Provide an improved and refined enhancement based on the critique. This enhancement should be more comprehensive, accurate, and complete compared to the initial enhancement. The final enhancement should be more clear and concise than the initial enhancement.]
// </final_enhancement>
// \`\`\`

// **User's Prompt:** ${prompt}

// Please enhance the above prompt using the structured 3-part format.`;

//   try {

//     // if (!config.openaiKey) throw new Error("Cannot process enhanced prompt because open ai model is failed to be configured");
    
//     const llm = new ChatOpenAI({
//       apiKey: config.openaiKey || "",
//       model: "gpt-4o-mini",
//       temperature: 0.3,
//     });

//     const response = await llm.invoke(enhancedPrompt);
//     const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    
//     // Extract only the final answer section
//     const finalEnhancementMatch = content.match(/<final_enhancement>([\s\S]*?)<\/final_enhancement>/);
    
//     if (finalEnhancementMatch && finalEnhancementMatch[1]) {
//       console.log("finalEnhancementMatch", finalEnhancementMatch[1].trim());
//       return finalEnhancementMatch[1].trim();
//     } else {
//       // Fallback: return the full response if parsing fails
//       return content
//     }
    
//   } catch (error) {
//     console.error(`Error processing enhanced prompt: ${error}`);
//     return prompt;
//   }
// }; 

// export const enhancePromptToolDef = tool(
//   async ({ prompt }: { prompt: string }): Promise<string> => {
//     const result = await enhancePromptTool({ prompt });
//     return `Enhanced prompt: ${JSON.stringify(result)}`
//   },
//   {
//     name: "enhance-prompt",
//     description: "If prompt is not clear, enhance a user prompt using a structured 3-part thinking process and return the refined final answer",
//     schema: z.object({
//       prompt: z.string(),
//     }),
//   }
// ); 