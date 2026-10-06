import { z } from "zod";

/** MCP SDK expects a Zod raw shape; unwrap z.object wrappers from tool definitions. */
export function zodInputShape(schema: z.ZodTypeAny): z.ZodRawShape {
  if (schema instanceof z.ZodObject) {
    return schema.shape as z.ZodRawShape;
  }
  return {};
}
