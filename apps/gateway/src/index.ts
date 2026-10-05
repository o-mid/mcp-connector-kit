import { createDefaultCache, createSourceRegistry, RedisCache, type SourceRegistry } from "@mck/core";
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
  return createSourceRegistry(sources, {
    cache,
    legacyToolNames: config.MCK_LEGACY_TOOL_NAMES === true,
    legacyErrors: config.MCK_LEGACY_ERRORS === true,
  });
}

export function createGatewayFromEnv(env: NodeJS.ProcessEnv = process.env): SourceRegistry {
  return createGatewayRegistry(loadConfig(env));
}
