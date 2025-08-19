import { tool } from "@langchain/core/tools";
import z from "zod";

/**
 * Type definition for schema fields in a simple, developer-friendly format.
 * Provides an alternative to Zod schemas for basic type definitions.
 */
type SchemaField = {
  /** The primitive type of the field */
  type: "number" | "string" | "boolean" | "object";
  /** Human-readable description of the field's purpose */
  description: string;
  /** Whether this field is optional (default: false) */
  optional?: boolean;
};

/**
 * Schema definition using simple field objects instead of Zod.
 * Mapped from field names to their type definitions.
 */
export type AgentToolSchema = Record<string, SchemaField>;

/**
 * Configuration options for creating agent tools with createAgentTool.
 * 
 * @template TInput - Type of the input object expected by the tool
 * @template TResult - Type of the result returned by the tool
 */
export interface AgentToolOptions<TInput = any, TResult = any> {
  /** Unique name for the tool (used for LLM tool selection) */
  name: string;
  /** Clear description of what the tool does (helps LLM choose when to use it) */
  description: string;
  /** Simple schema definition (alternative to zodSchema) */
  schema?: AgentToolSchema;
  /** Zod schema for input validation (alternative to schema) */
  zodSchema?: z.ZodTypeAny;
  /** Function that executes the tool's logic */
  run: (input: TInput) => Promise<TResult> | TResult;
}

/**
 * Convert simple schema definition to Zod schema for validation.
 * 
 * @param schema - Simple schema object with field definitions
 * @returns Zod object schema for input validation
 * @throws {Error} When an unsupported field type is encountered
 * 
 * @example
 * ```typescript
 * const schema = {
 *   name: { type: "string", description: "User name" },
 *   age: { type: "number", description: "User age", optional: true }
 * };
 * const zodSchema = schemaToZod(schema);
 * ```
 */
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
 * Factory function to create a standardized agent tool with logging, error handling, and schema validation.
 * This is the primary way to create tools that integrate with the DelReact agent framework.
 * 
 * @template TInput - Type of the input object the tool expects
 * @template TResult - Type of the result the tool returns
 * @param options - Tool configuration including name, description, schema, and execution function
 * @returns LangChain DynamicStructuredTool ready for agent use
 * @throws {Error} When neither schema nor zodSchema is provided
 * 
 * @example
 * ```typescript
 * const weatherTool = createAgentTool({
 *   name: "get-weather",
 *   description: "Get current weather for a location",
 *   schema: {
 *     location: { type: "string", description: "City name or coordinates" },
 *     units: { type: "string", description: "Temperature units", optional: true }
 *   },
 *   async run({ location, units = "celsius" }) {
 *     // Fetch weather data
 *     return { temperature: 22, conditions: "sunny", units };
 *   }
 * });
 * ```
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
      schema: finalSchema,
    }
  );
}

/**
 * Type alias for tools created with createAgentTool.
 * Represents a LangChain DynamicStructuredTool configured for DelReact agents.
 */
export type AgentTool = ReturnType<typeof createAgentTool>
