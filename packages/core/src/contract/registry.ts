import { MemoryCache, singleFlight } from "../cache/memory.js";
import { stableHashInput } from "../cache/types.js";
import { ConnectorError, isConnectorError } from "../errors.js";
import { createSourceHttp } from "../http/client.js";
import type {
  RegisteredTool,
  SourceDefinition,
  SourceHealthStatus,
  ToolCallResult,
  ToolContext,
} from "./types.js";
import { defineTool } from "./define.js";
import { z } from "zod";
import { validateInput, validateOutput, validateUpstream } from "./validate.js";
import { withToolSpan } from "../telemetry/spans.js";
import type { CacheStore } from "../cache/types.js";
import type { MetricsRecorder } from "./types.js";

const noopLog = {
  info: () => undefined,
  warn: () => undefined,
};

const noopMetrics: MetricsRecorder = {
  increment: () => undefined,
  observe: () => undefined,
};

export type SourceRegistryOptions = {
  cache: CacheStore;
  legacyToolNames?: boolean;
  legacyErrors?: boolean;
  metrics?: MetricsRecorder;
  log?: ToolContext["log"];
  /** Emit structured audit events on every tool call (for paid / enterprise export). */
  auditLog?: boolean;
  tenantId?: string;
};

export type SourceRegistry = {
  listTools: () => RegisteredTool[];
  listToolNames: () => string[];
  callTool: (name: string, args: unknown, signal?: AbortSignal) => Promise<ToolCallResult>;
  sourceHealth: () => Record<string, SourceHealthStatus>;
};

/**
 * Wires sources into callable tools with cache, HTTP, and validation.
 */
export function createSourceRegistry(
  sources: SourceDefinition[],
  opts: SourceRegistryOptions,
): SourceRegistry {
  const metrics = opts.metrics ?? noopMetrics;
  const log = opts.log ?? noopLog;
  const health: Record<string, SourceHealthStatus> = {};
  for (const s of sources) health[s.id] = "healthy";

  const tools: RegisteredTool[] = [];
  const byName = new Map<string, RegisteredTool>();

  for (const source of sources) {
    for (const tool of source.tools) {
      const qualified = `${source.id}.${tool.name}`;
      const reg: RegisteredTool = {
        ...tool,
        qualifiedName: qualified,
        legacyName: tool.name,
        sourceId: source.id,
      };
      tools.push(reg);
      byName.set(qualified, reg);
      if (opts.legacyToolNames) {
        if (!byName.has(tool.name)) byName.set(tool.name, reg);
      }
    }
    if (!source.tools.some((t) => t.name === "health")) {
      const healthTool = defineTool({
        name: "health",
        description: `Health status for ${source.title}.`,
        input: z.object({}),
        upstream: z.object({ status: z.string() }),
        output: z.object({
          source: z.string(),
          status: z.enum(["healthy", "degraded", "failing"]),
        }),
        async run({ ctx }) {
          if (source.health) {
            try {
              await source.health(ctx);
            } catch {
              return { source: source.id, status: health[source.id] ?? "failing" };
            }
          }
          return { source: source.id, status: health[source.id] ?? "healthy" };
        },
      });
      const reg: RegisteredTool = {
        ...healthTool,
        qualifiedName: `${source.id}.health`,
        legacyName: "health",
        sourceId: source.id,
      };
      tools.push(reg);
      byName.set(reg.qualifiedName, reg);
    }
  }

  const contexts = new Map<string, ToolContext>();
  for (const source of sources) {
    contexts.set(source.id, {
      sourceId: source.id,
      http: createSourceHttp({
        sourceId: source.id,
        baseUrls: source.baseUrls,
        userAgent: source.userAgent,
        limits: source.limits,
        maxResponseBytes: 5 * 1024 * 1024,
      }),
      cache: opts.cache,
      log,
      metrics,
      clock: () => Date.now(),
    });
  }

  async function callTool(name: string, args: unknown, signal?: AbortSignal): Promise<ToolCallResult> {
    const tool = byName.get(name);
    if (!tool) {
      return {
        ok: false,
        error: new ConnectorError("invalid_input", `Unknown tool: ${name}`).toPayload(),
      };
    }
    return withToolSpan(
      "mck.tool.call",
      { "mck.tool": name, "mck.source": tool.sourceId },
      async () => {
        const ctxBase = contexts.get(tool.sourceId);
        if (!ctxBase) {
          return {
            ok: false,
            error: new ConnectorError("internal", "Missing source context").toPayload(),
          };
        }
        const ctx: ToolContext = signal ? { ...ctxBase, signal } : ctxBase;
        const started = Date.now();
        log.info({ tool: name, source: tool.sourceId }, "tool_call_start");
        try {
          const input = validateInput(tool.inputSchema, args ?? {}, tool.sourceId);
          const cacheKey = `${tool.sourceId}:${tool.name}:${stableHashInput(input)}`;
          const ttl =
            tool.cacheTtlMs ?? sources.find((s) => s.id === tool.sourceId)?.cache.defaultTtlMs ?? 0;

          const run = async () => {
            const raw = await tool.run({ input, ctx, signal: signal ?? AbortSignal.timeout(60_000) });
            const out = validateOutput(tool.output, raw, tool.sourceId);
            return out;
          };

          let data: unknown;
          if (ttl > 0) {
            const cached = await ctx.cache.get<unknown>(cacheKey);
            if (cached != null) {
              metrics.increment("mck_cache_hits_total", { source: tool.sourceId, tool: tool.name });
              data = cached;
            } else {
              data = await singleFlight(cacheKey, run);
              await ctx.cache.set(cacheKey, data, ttl);
            }
          } else {
            data = await run();
          }

          const durationMs = Date.now() - started;
          metrics.increment("mck_tool_calls_total", {
            source: tool.sourceId,
            tool: tool.name,
            outcome: "ok",
          });
          metrics.observe("mck_tool_duration_seconds", durationMs / 1000, {
            source: tool.sourceId,
            tool: tool.name,
          });
          log.info(
            { tool: name, source: tool.sourceId, duration_ms: durationMs, outcome: "ok" },
            "tool_call_end",
          );
          if (opts.auditLog) {
            log.info(
              {
                audit: true,
                event: "tool_call",
                tenant: opts.tenantId ?? "default",
                tool: name,
                source: tool.sourceId,
                outcome: "ok",
                duration_ms: durationMs,
              },
              "audit",
            );
          }
          health[tool.sourceId] = "healthy";
          return {
            ok: true,
            data,
            legacyPretty: tool.legacyJsonPretty === true,
          };
        } catch (err) {
          const durationMs = Date.now() - started;
          metrics.increment("mck_tool_calls_total", {
            source: tool.sourceId,
            tool: tool.name,
            outcome: "error",
          });
          log.warn(
            {
              tool: name,
              source: tool.sourceId,
              duration_ms: durationMs,
              outcome: "error",
              error: err instanceof Error ? err.message : String(err),
            },
            "tool_call_end",
          );
          if (opts.auditLog) {
            log.info(
              {
                audit: true,
                event: "tool_call",
                tenant: opts.tenantId ?? "default",
                tool: name,
                source: tool.sourceId,
                outcome: "error",
                duration_ms: durationMs,
                error: err instanceof Error ? err.message : String(err),
              },
              "audit",
            );
          }
          if (err instanceof ConnectorError && err.code === "upstream_schema_changed") {
            health[tool.sourceId] = "degraded";
          } else if (isConnectorError(err)) {
            health[tool.sourceId] = "degraded";
          } else {
            health[tool.sourceId] = "failing";
          }
          const payload = isConnectorError(err)
            ? err.toPayload()
            : new ConnectorError("internal", err instanceof Error ? err.message : "Unknown error", {
                source: tool.sourceId,
              }).toPayload();
          const failure: ToolCallResult = { ok: false, error: payload };
          if (opts.legacyErrors) {
            failure.legacyErrorShape = true;
          }
          return failure;
        }
      },
    );
  }

  return {
    listTools: () => tools,
    listToolNames: () => [...byName.keys()],
    callTool,
    sourceHealth: () => ({ ...health }),
  };
}

export function createDefaultCache(): CacheStore {
  return new MemoryCache(500);
}

export { validateUpstream };
