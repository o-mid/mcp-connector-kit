import type { z } from "zod";
import type { DefinedTool, SourceDefinition } from "./types.js";

/** Declares a read-only MCP tool with upstream and output validation hooks. */
export function defineTool<TInput, TOutput, TUpstream>(tool: {
  name: string;
  description: string;
  input: z.ZodType<TInput>;
  upstream: z.ZodType<TUpstream>;
  output: z.ZodType<TOutput>;
  cacheTtlMs?: number;
  legacyJsonPretty?: boolean;
  run: (args: {
    input: TInput;
    ctx: import("./types.js").ToolContext;
    signal: AbortSignal;
  }) => Promise<TOutput>;
}): DefinedTool<unknown, unknown, unknown> {
  const defined: DefinedTool<unknown, unknown, unknown> = {
    name: tool.name,
    description: tool.description,
    inputSchema: tool.input,
    upstream: tool.upstream,
    output: tool.output,
    run: tool.run as DefinedTool<unknown, unknown, unknown>["run"],
  };
  if (tool.cacheTtlMs !== undefined) defined.cacheTtlMs = tool.cacheTtlMs;
  if (tool.legacyJsonPretty !== undefined) defined.legacyJsonPretty = tool.legacyJsonPretty;
  return defined;
}

/** Bundles tools and upstream policy for one third-party source. */
export function defineSource(source: {
  id: string;
  title: string;
  baseUrls: string[];
  limits: SourceDefinition["limits"];
  cache: SourceDefinition["cache"];
  userAgent?: string;
  health?: SourceDefinition["health"];
  tools: DefinedTool<unknown, unknown, unknown>[];
}): SourceDefinition {
  const ua = source.userAgent ?? `mck/${source.id} (+read-only)`;
  const defined: SourceDefinition = {
    id: source.id,
    title: source.title,
    baseUrls: source.baseUrls,
    limits: source.limits,
    cache: source.cache,
    userAgent: ua,
    tools: source.tools,
  };
  if (source.health) defined.health = source.health;
  return defined;
}
