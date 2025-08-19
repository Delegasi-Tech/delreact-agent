// src/utilities.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { SystemMessage, HumanMessage, AIMessage, ToolMessage } from "@langchain/core/messages";

export interface LlmCallOptions {
  provider: LlmProvider;
  model?: string;
  maxTokens?: number;
  tools?: DynamicStructuredTool[];
  enableToolSummary?: boolean;
}

export interface ObservabilityConfig {
  heliconeKey?: string;
  cacheEnabled?: boolean;
  additionalHeaders?: Record<string, string>;
}

export function getProviderKey(provider: LlmProvider): string {  
  switch (provider) {
    case "gemini":
      return "geminiKey";
    case "openai":
      return "openaiKey";
    case "openrouter":
      return "openrouterKey";
    default:
      return 'geminiKey'
  }
}

const memoryStore: Record<string, InMemoryChatMessageHistory> = {};

function getObservabilityConfig(options: LlmCallOptions) : Record<string, string> | undefined {

  if (!options?.observability) {
    throw new Error("Observability is not set in options");
  }

  const observability = options.observability as ObservabilityConfig;


  const heliconeApiKey = observability.heliconeKey;

  if (!heliconeApiKey) {
    throw new Error("Helicone API key is not set in options");
  }

  const headers: Record<string, string> = {};

  headers["Helicone-Auth"] = `Bearer ${heliconeApiKey}`;

  // Apply observability settings
  if (observability.additionalHeaders) {
    Object.assign(headers, observability.additionalHeaders);
  }

  if (observability.userId) {
    headers["Helicone-User-Id"] = observability.userId;
  }

  if (observability.cacheEnabled !== undefined) {
    headers["Helicone-Cache-Enabled"] = String(observability.cacheEnabled);
  }


  if (options.sessionId) {
    headers["Helicone-Session-Id"] = options.sessionId;
  }

  if (observability.sessionName) {
    headers["Helicone-Session-Name"] = observability.sessionName;
  } else {
    headers["Helicone-Session-Name"] = `Session-${options.sessionId || Date.now()}`;
  }

  return headers;
}

function buildConfig(options: LlmCallOptions) {

  if (!options.observability?.enabled) {
    switch (options.provider) {
      case "openai":
        return {
          defaultHeaders: options.addHeaders || {},
        }
      case "openrouter":
        return {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "Authorization": `Bearer ${options.apiKey}`,
            ...(options.addHeaders || {})
          }
        }
      default:
        throw new Error(`This provider ${options.provider} does not have config`);
    }
  }


  const observabilityConfig = getObservabilityConfig(options);

  const headers = {
    ...observabilityConfig,
    ...(options.addHeaders || {})
  }

  let baseURL: string;

  switch (options.provider) {
    case "openai":
      baseURL = "https://oai.helicone.ai/v1";
      break;
    case "openrouter":
      baseURL = "https://openrouter.helicone.ai/api/v1";
      headers["Authorization"] = `Bearer ${options.apiKey}`;
      break;
    default:
      throw new Error(`This provider ${options.provider} does not have config`);
  }

  return {
    baseURL,
    defaultHeaders: headers
  }
}

function getLLMModel(options: LlmCallOptions) {
  const { provider, model, temperature, maxTokens } = options;

  const tools = getToolsArray(options.tools);

  if (!options.apiKey) throw new Error("API_KEY is not set in options");

  switch (provider) {
    case "gemini":
      return new ChatGoogleGenerativeAI({
        apiKey: options.apiKey,
        model: model || "gemini-2.0-flash",
        maxOutputTokens: maxTokens ?? 2048,
      }).bindTools(tools);
    case "openai":
      const openaiConfig = buildConfig(options);
      return new ChatOpenAI({
        apiKey: options.apiKey,
        model: model || "gpt-4o-mini",
        temperature: temperature ?? 1,
        // maxTokens: maxTokens ?? 2048,
        configuration: {
          ...openaiConfig,
        },
      }).bindTools(tools);
    case "openrouter":
      const openrouterConfig = buildConfig(options);
      return new ChatOpenAI({
        apiKey: options.apiKey,
        model: model || "openai/gpt-4o-mini",
        temperature: temperature ?? 1,
        // maxTokens: maxTokens ?? 2048,
        configuration: {
          ...openrouterConfig,
        },
      }).bindTools(tools);
    // You can add more cases for other providers here if needed
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}

function getToolsArray(tools?: DynamicStructuredTool[]): DynamicStructuredTool[] {
  return tools || [];
}

export async function llmCall(
  input: string,
  options: LlmCallOptions
): Promise<string> {
  const llmModel = getLLMModel(options);
  const tools = getToolsArray(options.tools);
  const sessionId = options.sessionId || `default-${Date.now()}`;

  if (!memoryStore[sessionId]) {
    memoryStore[sessionId] = new InMemoryChatMessageHistory();
  }

  try {
    // Resolve memory references in input before processing
    const resolvedInput = await resolveMemoryReferencesInText(input, options.memory);

    // Prepare messages for LLM
    const history = await memoryStore[sessionId].getMessages();
    const systemMessage = new SystemMessage(`You are a helpful assistant with access to tools. Use tools intelligently when they would provide better, more accurate, or more comprehensive answers. If you need previous agent results, look for memory references in the format "@in-memory_AgentName_result_key" and pass them as tool arguments.`);
    const userMessage = new HumanMessage(resolvedInput);
    const messages = [
      systemMessage,
      ...history,
      userMessage
    ];

    // Get initial LLM response
    const response = await llmModel.invoke(messages) as AIMessage;
    await memoryStore[sessionId].addMessage(userMessage);

    // Handle tool calls if present
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolResult = await processToolCalls(
        response,
        llmModel,
        tools,
        sessionId,
        options.memory,
        5, // NOTE: This is the limit of tool calls iteration to prevent infinite loop
        options.enableToolSummary
      );

      // Return appropriate result based on enableToolSummary setting
      if (Array.isArray(toolResult)) {
        // Raw tool results (no LLM summary)
        return toolResult.map(msg => msg.content).join('\n\n');
      } else {
        // LLM summary of tool results
        return typeof toolResult.content === "string"
          ? toolResult.content
          : JSON.stringify(toolResult.content);
      }
    } else {
      // No tool calls - return direct response
      await memoryStore[sessionId].addMessage(response);
      return typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);
    }

  } catch (e: any) {
    console.error(`LLM call error:`, e);
    return `${options.provider === "gemini" ? "Gemini" : "OpenAI"} error: ${e.message}`;
  }
}

async function processToolCalls(
  initialResponse: AIMessage,
  llmModel: any,
  tools: DynamicStructuredTool[],
  sessionId: string,
  memory?: any,
  maxIterations: number = 5,
  enableToolSummary: boolean = true
): Promise<AIMessage | ToolMessage[]> {
  let currentResponse = initialResponse;
  let toolMessages: ToolMessage[] = [];
  let iteration = 0;

  // Process tool calls iteratively
  while (currentResponse.tool_calls && currentResponse.tool_calls.length > 0 && iteration < maxIterations) {
    console.log(`🔄 Processing tool calls - iteration ${iteration + 1}/${maxIterations}`);

    // Store current response in memory
    await memoryStore[sessionId].addMessage(currentResponse);

    // Execute all tool calls
    toolMessages = await executeAllToolCalls(currentResponse.tool_calls, tools, memory);

    // Store tool results in memory
    await memoryStore[sessionId].addMessages(toolMessages);

    // Get next response based on enableToolSummary setting
    if (enableToolSummary) {
      // Get LLM summary of tool results
      const updatedHistory = await memoryStore[sessionId].getMessages();
      currentResponse = await llmModel.invoke(updatedHistory);
    } else {
      // Stop iteration and return raw tool results
      break;
    }

    iteration++;
  }

  // Handle max iterations warning
  if (iteration >= maxIterations && currentResponse.tool_calls && currentResponse.tool_calls.length > 0) {
    console.warn(`⚠️ Reached maximum tool call iterations (${maxIterations}). Stopping to prevent infinite loop.`);
  }

  // Return appropriate result
  if (enableToolSummary) {
    // Store final response and return LLM summary
    await memoryStore[sessionId].addMessage(currentResponse);
    return currentResponse;
  } else {
    // Return raw tool results
    return toolMessages;
  }
}

async function executeAllToolCalls(
  toolCalls: any[],
  tools: DynamicStructuredTool[],
  memory?: any
): Promise<ToolMessage[]> {
  const toolMessages: ToolMessage[] = [];

  for (const toolCall of toolCalls) {
    try {
      const toolResult = await executeTool(toolCall.name, toolCall.args, tools, memory);
      console.log(`✅ Tool ${toolCall.name} executed successfully`);

      const toolMessage = new ToolMessage({
        content: toolResult,
        tool_call_id: toolCall.id as string,
      });

      toolMessages.push(toolMessage);
    } catch (error) {
      console.error(`❌ Tool execution failed for ${toolCall.name}:`, error);
      const errorMessage = new ToolMessage({
        content: `Error executing ${toolCall.name}: ${error}`,
        tool_call_id: toolCall.id as string,
      });

      toolMessages.push(errorMessage);
    }
  }

  return toolMessages;
}

async function executeTool(
  toolName: string,
  toolArgs: any,
  tools: DynamicStructuredTool[],
  memory?: any
): Promise<string> {
  const tool = tools.find(tool => tool.name === toolName);
  if (!tool) throw new Error(`Tool ${toolName} not found`);

  // Smart retrieval: Resolve agent memory references in tool arguments
  if (memory) {
    const resolvedArgs = await resolveMemoryReferences(toolArgs, memory);
    return tool.invoke(resolvedArgs);
  }

  return tool.invoke(toolArgs);
}

async function resolveMemoryReferencesInText(text: string, memory: any): Promise<string> {
  if (!text || !memory) return text;

  // Find all memory references in the text
  const memoryKeyRegex = /@in-memory_[^\s\n]+/g;
  const memoryKeys = text.match(memoryKeyRegex) || [];

  let resolvedText = text;

  for (const memoryKey of memoryKeys) {
    try {
      console.log(`🔍 Resolving memory reference in text: ${memoryKey}`);
      const data = await memory.retrieve(memoryKey);
      const actualResult = data?.result || memoryKey;

      // Replace the memory key with the actual result
      resolvedText = resolvedText.replace(memoryKey, actualResult);
    } catch (error) {
      console.error(`❌ Failed to resolve memory reference ${memoryKey}:`, error);
      // Keep the original reference if resolution fails
    }
  }

  return resolvedText;
}

async function resolveMemoryReferences(args: any, memory: any): Promise<any> {
  if (!args || !memory) return args;

  console.log(`🔍 Resolving agent memory references in tool arguments: ${JSON.stringify(args)}`);

  // Handle different argument types
  if (typeof args === 'string' && args.startsWith('@in-memory_')) {
    // Agent result memory reference
    console.log(`🔍 Resolving agent memory reference: ${args}`);
    const data = await memory.retrieve(args);
    return data?.result || args;
  }

  if (typeof args === 'object') {
    // Handle object with potential memory references
    const resolved: any = {};
    for (const [key, value] of Object.entries(args)) {
      if (typeof value === 'string' && value.startsWith('@in-memory_')) {
        console.log(`🔍 Resolving memory reference in ${key}: ${value}`);
        const data = await memory.retrieve(value);
        resolved[key] = data?.result || value;
      } else {
        resolved[key] = value;
      }
    }
    return resolved;
  }

  return args;
}
