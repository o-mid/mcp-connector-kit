import type { z } from "zod";
import type { CacheStore } from "../cache/types.js";
import type { SourceHttpClient } from "../http/client.js";
import type { ConnectorErrorPayload } from "../errors.js";

export type SourceLimits = {
  rps: number;
  burst: number;
  concurrency: number;
  timeoutMs: number;
};

export type SourceCacheConfig = {
  defaultTtlMs: number;
};

export type ToolContext = {
  sourceId: string;
  http: SourceHttpClient;
  cache: CacheStore;
  log: { info: (obj: object, msg?: string) => void; warn: (obj: object, msg?: string) => void };
  metrics: MetricsRecorder;
  clock: () => number;
  signal?: AbortSignal;
};

export type MetricsRecorder = {
  increment: (name: string, labels?: Record<string, string>, value?: number) => void;
  observe: (name: string, value: number, labels?: Record<string, string>) => void;
};

export type ToolRunArgs<TInput> = {
  input: TInput;
  ctx: ToolContext;
  signal: AbortSignal;
};

export type DefinedTool<TInput, TOutput, TUpstream> = {
  name: string;
  description: string;
  inputSchema: z.ZodType<TInput>;
  upstream: z.ZodType<TUpstream>;
  output: z.ZodType<TOutput>;
  cacheTtlMs?: number;
  run: (args: ToolRunArgs<TInput>) => Promise<TOutput>;
  legacyJsonPretty?: boolean;
};

export type SourceHealthStatus = "healthy" | "degraded" | "failing";

export type SourceDefinition = {
  id: string;
  title: string;
  baseUrls: string[];
  limits: SourceLimits;
  cache: SourceCacheConfig;
  userAgent: string;
  health?: (ctx: ToolContext) => Promise<unknown>;
  tools: DefinedTool<unknown, unknown, unknown>[];
};

export type ToolCallResult =
  | { ok: true; data: unknown; legacyPretty: boolean }
  | {
      ok: false;
      error: ConnectorErrorPayload;
      /** Khanoumi / cosmetic style `{ error: string }` JSON. */
      legacyErrorShape?: boolean;
      /** Torob style plain-text error message. */
      legacyTorobPlain?: boolean;
    };

export type RegisteredTool = DefinedTool<unknown, unknown, unknown> & {
  qualifiedName: string;
  legacyName: string;
  sourceId: string;
};
