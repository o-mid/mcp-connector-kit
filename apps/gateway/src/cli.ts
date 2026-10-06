#!/usr/bin/env node
/**
 * Gateway binary: env → SourceRegistry → MCP over stdio or Streamable HTTP.
 * Docker/Railway invoke `node dist/cli.js` with MCK_TRANSPORT=http by default.
 */
import { connectStdio, createMcpServer, startHttpApp } from "@mck/server";
import { createGatewayRegistry } from "./index.js";
import { loadConfig } from "./config.js";
import { FREE_TIER_SOURCES } from "./tier.js";
import { initOtelIfConfigured } from "./otel.js";

async function main(): Promise<void> {
  await initOtelIfConfigured();
  const config = loadConfig();
  const registry = createGatewayRegistry(config);
  if (config.MCK_TRANSPORT === "http") {
    // Hosted path: /mcp, /healthz, /readyz, /metrics (+ optional OAuth metadata).
    const demoRegistry = config.MCK_PUBLIC_DEMO
      ? createGatewayRegistry({
          ...config,
          sku: "free",
          sourceIds: [...FREE_TIER_SOURCES],
        })
      : undefined;
    const app = await startHttpApp({
      registry,
      port: config.PORT,
      apiKeys: config.apiKeys,
      ...(demoRegistry ? { demoRegistry } : {}),
      ...(config.MCK_OAUTH_JWKS_URL
        ? {
            oauth: {
              jwksUrl: config.MCK_OAUTH_JWKS_URL,
              ...(config.MCK_OAUTH_AUDIENCE ? { audience: config.MCK_OAUTH_AUDIENCE } : {}),
              ...(config.MCK_OAUTH_ISSUER ? { issuer: config.MCK_OAUTH_ISSUER } : {}),
              ...(config.MCK_OAUTH_TENANT_CLAIM
                ? { tenantClaim: config.MCK_OAUTH_TENANT_CLAIM }
                : {}),
            },
          }
        : {}),
      corsOrigins: config.corsOrigins,
      gatewaySku: config.sku,
      legacyErrors: config.MCK_LEGACY_ERRORS,
    });
    const shutdown = async () => {
      await app.close();
      process.exit(0);
    };
    process.on("SIGTERM", () => void shutdown());
    process.on("SIGINT", () => void shutdown());
    console.error(`mck gateway listening on :${config.PORT} (sku=${config.sku})`);
    return;
  }
  // Local IDE path: one process, stdin/stdout MCP framing.
  const server = createMcpServer(registry, {
    name: "mck-gateway",
    version: "1.0.0",
    legacyErrors: config.MCK_LEGACY_ERRORS,
  });
  await connectStdio(server);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
