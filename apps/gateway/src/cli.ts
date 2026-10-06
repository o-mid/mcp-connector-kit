#!/usr/bin/env node
/**
 * Gateway binary: env → SourceRegistry → MCP over stdio or Streamable HTTP.
 * Docker/Railway invoke `node dist/cli.js` with MCK_TRANSPORT=http by default.
 */
import { connectStdio, createMcpServer, startHttpApp } from "@mck/server";
import { createGatewayFromEnv, createGatewayRegistry } from "./index.js";
import { loadConfig } from "./config.js";
import { initOtelIfConfigured } from "./otel.js";

async function main(): Promise<void> {
  await initOtelIfConfigured();
  const config = loadConfig();
  const registry = createGatewayRegistry(config);
  if (config.MCK_TRANSPORT === "http") {
    // Hosted path: /mcp, /healthz, /readyz, /metrics (+ optional OAuth metadata).
    const app = await startHttpApp({
      registry,
      port: config.PORT,
      apiKeys: config.apiKeys,
      ...(config.MCK_OAUTH_JWKS_URL
        ? {
            oauth: {
              jwksUrl: config.MCK_OAUTH_JWKS_URL,
              ...(config.MCK_OAUTH_AUDIENCE ? { audience: config.MCK_OAUTH_AUDIENCE } : {}),
            },
          }
        : {}),
      corsOrigins: config.corsOrigins,
      gatewaySku: config.sku,
      legacyErrors: config.MCK_LEGACY_ERRORS === true,
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
    legacyErrors: config.MCK_LEGACY_ERRORS === true,
  });
  await connectStdio(server);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
