import { createDefaultCache, createSourceRegistry, createMckLogger, RedisCache, toolLogFromPino, type SourceRegistry } from "@mck/core";
import { createPrometheusRecorder, metricsRegistry } from "@mck/server";
import { loadConfig, type GatewayConfig } from "./config.js";
import { resolveSources } from "./sources.js";

/** Builds the tool registry from gateway environment configuration. */
export function createGatewayRegistry(config: GatewayConfig): SourceRegistry {
  const cache =
    config.MCK_CACHE === "redis" && config.REDIS_URL
      ? new RedisCache(config.REDIS_URL)
      : createDefaultCache();
  const sourceOpts = config.wooShops ? { wooShops: config.wooShops } : {};
  const sources = resolveSources(config.sourceIds, sourceOpts);
  const logger = createMckLogger(config.LOG_LEVEL);
  return createSourceRegistry(sources, {
    cache,
    legacyToolNames: config.MCK_LEGACY_TOOL_NAMES === true,
    legacyErrors: config.MCK_LEGACY_ERRORS === true,
    metrics: createPrometheusRecorder(metricsRegistry),
    log: toolLogFromPino(logger),
  });
}

export function createGatewayFromEnv(env: NodeJS.ProcessEnv = process.env): SourceRegistry {
  return createGatewayRegistry(loadConfig(env));
}
