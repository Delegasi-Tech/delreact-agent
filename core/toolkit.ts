import { tool } from "@langchain/core/tools";
import z from "zod";

type SchemaField = {
  type: "number" | "string" | "boolean" | "object" | "array";
  description: string;
  optional?: boolean;
  items?: SchemaField; // For array item type
};

export type AgentToolSchema = Record<string, SchemaField>;

export interface AgentToolOptions<TInput = any, TResult = any> {
  name: string;
  description: string;
  schema?: AgentToolSchema;
  zodSchema?: z.ZodTypeAny;
  run: (input: TInput) => Promise<TResult> | TResult;
}

function fieldToZodType(field: SchemaField): z.ZodTypeAny {
  let zodType: z.ZodTypeAny;
  
  switch (field.type) {
    case "number":
      zodType = z.number();
      break;
    case "string":
      zodType = z.string();
      break;
    case "boolean":
      zodType = z.boolean();
      break;
    case "object":
      zodType = z.object({}).catchall(z.any());
      break;
    case "array":
      if (field.items) {
        const itemType = fieldToZodType(field.items);
        zodType = z.array(itemType);
      } else {
        zodType = z.array(z.any());
      }
      break;
    default:
      throw new Error(`Unsupported type: '${field.type}'`);
  }
  
  if (field.optional) zodType = zodType.optional();
  zodType = zodType.describe(field.description);
  
  return zodType;
}

function schemaToZod(schema: AgentToolSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, field] of Object.entries(schema)) {
    shape[key] = fieldToZodType(field);
  }
  return z.object(shape);
}

/**
 * Create a custom tool for DelReact agents
 */
export function createAgentTool<TInput = any, TResult = any>({
  name,
  description,
  schema,
  zodSchema,
  run,
}: AgentToolOptions<TInput, TResult>) {
  if (!zodSchema && !schema) throw new Error("Either schema or zodSchema must be provided");
  const finalSchema: z.ZodTypeAny = zodSchema ?? (schema ? schemaToZod(schema) : z.any());
  return tool(
    async (input: TInput) => {
      // Remove agentConfig from input if present for logging
      const { agentConfig, ...inputWithoutAgentConfig } = (input || {}) as Record<string, unknown>;
      console.log(`🛠️ [${name}] Starting processing`, { ...inputWithoutAgentConfig });
      try {
        const result = await run(input);
        // console.log(`🛠️ [${name}] Result`, { result });
        return typeof result === "string" ? result : JSON.stringify(result);
      } catch (error: any) {
        console.error(`🛠️ [${name}] Error`, { error: error.message, input });
        return `Error in ${name}: ${error.message}`;
      }
    },
    {
      name,
      description,
      schema: finalSchema as any,
    }
  ) as any;
}

export type AgentTool = ReturnType<typeof createAgentTool>
