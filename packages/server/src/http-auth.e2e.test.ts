import type { IncomingMessage } from "node:http";
import { createDefaultCache, createSourceRegistry } from "@mck/core";
import { fixtureSource } from "@mck/source-fixture";
import { prepareMcpHttpE2eNetwork } from "@mck/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { authenticateMcpRequest } from "./oauth.js";

beforeAll(() => {
  prepareMcpHttpE2eNetwork();
});

describe("MCP HTTP auth e2e", () => {
  it("rejects missing API key when keys are configured", async () => {
    const req = { headers: {} } as IncomingMessage;
    const result = await authenticateMcpRequest(req, { apiKeys: ["secret"] });
    expect(result.ok).toBe(false);
  });

  it("accepts configured API key bearer", async () => {
    const req = { headers: { authorization: "Bearer secret" } } as IncomingMessage;
    const result = await authenticateMcpRequest(req, { apiKeys: ["secret"] });
    expect(result.ok).toBe(true);
  });

  it("serves oauth protected resource metadata route via http app", async () => {
    const registry = createSourceRegistry([fixtureSource], { cache: createDefaultCache() });
    const { startHttpApp } = await import("./http-app.js");
    const app = await startHttpApp({
      registry,
      port: 0,
      oauth: { jwksUrl: "https://auth.example.com/.well-known/jwks.json", audience: "mcp" },
      publicBaseUrl: "http://127.0.0.1:9999",
    });
    const meta = (await fetch(
      `http://127.0.0.1:${app.port}/.well-known/oauth-protected-resource`,
    ).then((r) => r.json())) as { resource: string };
    expect(meta.resource).toBe("http://127.0.0.1:9999/mcp");
    await app.close();
  });
});
