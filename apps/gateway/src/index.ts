import type { SourceDefinition } from "@mck/core";
import { createDefaultCache, createSourceRegistry, createMckLogger, RedisCache, toolLogFromPino, type SourceRegistry } from "@mck/core";
import { createPrometheusRecorder, metricsRegistry } from "@mck/server";
import { loadConfig, type GatewayConfig } from "./config.js";
import { resolveSources } from "./sources.js";
import { limitMultiplierForSku } from "./tier.js";

function scaleSourceLimits(sources: SourceDefinition[], multiplier: number): SourceDefinition[] {
  if (multiplier <= 1) return sources;
  return sources.map((s) => ({
    ...s,
    limits: {
      ...s.limits,
      rps: s.limits.rps * multiplier,
      burst: s.limits.burst * multiplier,
      concurrency: Math.max(s.limits.concurrency, s.limits.concurrency * multiplier),
    },
  }));
}

/** Builds the tool registry from gateway environment configuration. */
export function createGatewayRegistry(config: GatewayConfig): SourceRegistry {
  // Cache is shared across all sources in this process (memory or Redis).
  const cache =
    config.MCK_CACHE === "redis" && config.REDIS_URL
      ? new RedisCache(config.REDIS_URL)
      : createDefaultCache();
  const resolved = resolveSources(config.sourceIds, { webReaderAllowlist: config.webReaderAllowlist });
  // Paid SKU doubles rps/burst/concurrency before tools see limits.
  const sources = scaleSourceLimits(resolved, limitMultiplierForSku(config.sku));
  const logger = createMckLogger(config.LOG_LEVEL);
  const registryOpts: Parameters<typeof createSourceRegistry>[1] = {
    cache,
    legacyToolNames: config.MCK_LEGACY_TOOL_NAMES,
    legacyErrors: config.MCK_LEGACY_ERRORS,
    metrics: createPrometheusRecorder(metricsRegistry),
    log: toolLogFromPino(logger),
  };
  if (config.MCK_AUDIT_LOG) registryOpts.auditLog = true;
  if (config.MCK_TENANT_ID) registryOpts.tenantId = config.MCK_TENANT_ID;
  return createSourceRegistry(sources, registryOpts);
}

export function createGatewayFromEnv(env: NodeJS.ProcessEnv = process.env): SourceRegistry {
  return createGatewayRegistry(loadConfig(env));
}

export { loadConfig, type GatewayConfig } from "./config.js";
export { TRUST_TIER_SOURCES, type GatewaySku } from "./tier.js";
