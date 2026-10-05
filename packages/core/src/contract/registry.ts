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
import { validateInput, validateOutput, validateUpstream } from "./validate.js";
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
    const ctxBase = contexts.get(tool.sourceId);
    if (!ctxBase) {
      return {
        ok: false,
        error: new ConnectorError("internal", "Missing source context").toPayload(),
      };
    }
    const ctx: ToolContext = signal ? { ...ctxBase, signal } : ctxBase;
    const started = Date.now();
    try {
      const input = validateInput(tool.inputSchema, args ?? {}, tool.sourceId);
      const cacheKey = `${tool.sourceId}:${tool.name}:${stableHashInput(input)}`;
      const ttl = tool.cacheTtlMs ?? sources.find((s) => s.id === tool.sourceId)?.cache.defaultTtlMs ?? 0;

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

      metrics.increment("mck_tool_calls_total", {
        source: tool.sourceId,
        tool: tool.name,
        outcome: "ok",
      });
      metrics.observe("mck_tool_duration_seconds", (Date.now() - started) / 1000, {
        source: tool.sourceId,
        tool: tool.name,
      });
      health[tool.sourceId] = "healthy";
      return {
        ok: true,
        data,
        legacyPretty: tool.legacyJsonPretty === true,
      };
    } catch (err) {
      metrics.increment("mck_tool_calls_total", {
        source: tool.sourceId,
        tool: tool.name,
        outcome: "error",
      });
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
      if (opts.legacyErrors) failure.legacyErrorShape = true;
      return failure;
    }
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
