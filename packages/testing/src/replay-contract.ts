import { createDefaultCache, createSourceRegistry, type SourceDefinition } from "@mck/core";
import { z } from "zod";
import { mockHttpJson, type HttpMockSpec } from "./mock-http.js";

export const ToolContract = z.object({
  source: z.string(),
  tool: z.string(),
  input: z.record(z.unknown()).optional(),
  upstream: z.unknown().optional(),
  mock: z
    .object({
      origin: z.string(),
      pathPrefix: z.string(),
      method: z.string().optional(),
      statusCode: z.number().optional(),
      body: z.unknown(),
    })
    .optional(),
  mocks: z.array(
    z.object({
      origin: z.string(),
      pathPrefix: z.string(),
      method: z.string().optional(),
      statusCode: z.number().optional(),
      body: z.unknown(),
    }),
  ).optional(),
  output: z.unknown().optional(),
});

export type ToolContractDoc = z.infer<typeof ToolContract>;

export type ReplayResult =
  | { ok: true; data: unknown; toolName: string }
  | { ok: false; toolName: string; error: unknown };

/**
 * Executes a tool contract against a single source with optional HTTP mocks.
 */
export async function replayToolContract(
  source: SourceDefinition,
  doc: ToolContractDoc,
  opts?: { legacyToolNames?: boolean },
): Promise<ReplayResult> {
  if (doc.source !== source.id) {
    throw new Error(`Contract source ${doc.source} does not match ${source.id}`);
  }

  const mocks: HttpMockSpec[] =
    doc.mocks?.map((m) => ({
      origin: m.origin,
      pathPrefix: m.pathPrefix,
      body: m.body,
      ...(m.method ? { method: m.method } : {}),
      ...(m.statusCode != null ? { statusCode: m.statusCode } : {}),
    })) ??
    (doc.mock
      ? [
          {
            origin: doc.mock.origin,
            pathPrefix: doc.mock.pathPrefix,
            body: doc.mock.body,
            ...(doc.mock.method ? { method: doc.mock.method } : {}),
            ...(doc.mock.statusCode != null ? { statusCode: doc.mock.statusCode } : {}),
          },
        ]
      : []);
  for (const mock of mocks) {
    mockHttpJson(mock);
  }

  const registryOpts: { cache: ReturnType<typeof createDefaultCache>; legacyToolNames?: boolean } = {
    cache: createDefaultCache(),
  };
  if (opts?.legacyToolNames === true) registryOpts.legacyToolNames = true;
  const registry = createSourceRegistry([source], registryOpts);

  const toolName = `${doc.source}.${doc.tool}`;
  let input: Record<string, unknown> = doc.input ?? {};
  if (!doc.input && doc.upstream != null && doc.tool === "echo") {
    const upstream = doc.upstream as { value?: string };
    input = { message: upstream.value ?? "" };
  }

  const res = await registry.callTool(toolName, input);
  if (!res.ok) {
    return { ok: false, toolName, error: res.error };
  }
  return { ok: true, toolName, data: res.data };
}
