import { tool } from "@langchain/core/tools";
import z from "zod";

/**
 * Type for schema definition in a simple, developer-friendly way.
 */
type SchemaField = {
  type: "number" | "string" | "boolean" | "object";
  description: string;
  optional?: boolean;
};

export type AgentToolSchema = Record<string, SchemaField>;

export interface AgentToolOptions<TInput = any, TResult = any> {
  name: string;
  description: string;
  schema?: AgentToolSchema;
  zodSchema?: z.ZodTypeAny;
  run: (input: TInput) => Promise<TResult> | TResult;
}

function schemaToZod(schema: AgentToolSchema): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const [key, field] of Object.entries(schema)) {
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
      default:
        throw new Error(`Unsupported type '${field.type}' for field '${key}'`);
    }
    if (field.optional) zodType = zodType.optional();
    zodType = zodType.describe(field.description);
    shape[key] = zodType;
  }
  return z.object(shape);
}

/**
 * Factory to create a standardized agent tool with logging, error handling, and schema validation.
 */
export function createAgentTool<TInput = any, TResult = any>({
  name,
  description,
  schema,
  zodSchema,
  run,
}: AgentToolOptions<TInput, TResult>) {
  if (!zodSchema && !schema) throw new Error("Either schema or zodSchema must be provided");
  const finalSchema = zodSchema ?? (schema ? schemaToZod(schema) : undefined);
  return tool(
    async (input: TInput) => {
      console.log(`🛠️ [${name}] Starting processing`, { input });
      try {
        const result = await run(input);
        console.log(`🛠️ [${name}] Result`, { result });
        return typeof result === "string" ? result : JSON.stringify(result);
      } catch (error: any) {
        console.error(`🛠️ [${name}] Error`, { error: error.message, input });
        return `Error in ${name}: ${error.message}`;
      }
    },
    {
      name,
      description,
      schema: finalSchema,
    }
  );
}
