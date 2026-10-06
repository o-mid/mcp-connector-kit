import { createGatewayRegistry } from "./index.js";
import { loadConfig } from "./config.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { asCallToolResult, mockHttpJson, parseFirstTextJson, prepareMcpHttpE2eNetwork } from "@mck/testing";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { beforeAll, describe, expect, it } from "vitest";
import { startHttpApp } from "@mck/server";

beforeAll(() => {
  prepareMcpHttpE2eNetwork();
});

function parseToolJson(result: unknown): unknown {
  return parseFirstTextJson(asCallToolResult(result));
}

describe("gateway HTTP MCP e2e", () => {
  it("serves default profile over Streamable HTTP", async () => {
    mockHttpJson({
      origin: "https://en.wikipedia.org",
      pathPrefix: "/w/api.php",
      body: [
        "Model Context Protocol",
        ["Model Context Protocol", "Model Context Protocol (computing)"],
        ["Open protocol for AI tools", "Computing topic"],
        [
          "https://en.wikipedia.org/wiki/Model_Context_Protocol",
          "https://en.wikipedia.org/wiki/Model_Context_Protocol_(computing)",
        ],
      ],
    });

    const registry = createGatewayRegistry(
      loadConfig({
        MCK_SOURCE_PROFILE: "default",
        MCK_LEGACY_TOOL_NAMES: "true",
        LOG_LEVEL: "silent",
      }),
    );

    const app = await startHttpApp({ registry, port: 0, legacyErrors: false });
    const url = new URL(`http://127.0.0.1:${app.port}/mcp`);
    const transport = new StreamableHTTPClientTransport(url);
    const client = new Client({ name: "mck-gateway-e2e", version: "1.0.0" });
    await client.connect(transport as Transport);

    const tools = await client.listTools();
    expect(tools.tools.map((t) => t.name)).toContain("wiki_search");
    expect(tools.tools.map((t) => t.name)).toContain("echo");

    const echo = await client.callTool({ name: "echo", arguments: { message: "gateway-e2e" } });
    expect(parseToolJson(echo)).toEqual({ echoed: "gateway-e2e" });

    const wiki = await client.callTool({
      name: "wiki_search",
      arguments: { query: "Model Context Protocol", limit: 2 },
    });
    expect(parseToolJson(wiki)).toEqual({
      query: "Model Context Protocol",
      results: [
        {
          title: "Model Context Protocol",
          description: "Open protocol for AI tools",
          url: "https://en.wikipedia.org/wiki/Model_Context_Protocol",
        },
        {
          title: "Model Context Protocol (computing)",
          description: "Computing topic",
          url: "https://en.wikipedia.org/wiki/Model_Context_Protocol_(computing)",
        },
      ],
    });

    await client.close();
    await app.close();
  });

  it("serves wikipedia on /demo/mcp without a key while /mcp stays locked", async () => {
    const paid = createGatewayRegistry(
      loadConfig({
        MCK_SOURCE_PROFILE: "trust",
        MCK_SKU: "paid",
        MCK_LEGACY_TOOL_NAMES: "true",
        MCK_API_KEYS: "secret",
        MCK_WEB_READER_ALLOWLIST: "https://example.com",
        LOG_LEVEL: "silent",
      }),
    );
    const demo = createGatewayRegistry({
      ...loadConfig({
        MCK_LEGACY_TOOL_NAMES: "true",
        LOG_LEVEL: "silent",
      }),
      sku: "free",
      sourceIds: ["fixture", "wikipedia"],
    });
    const app = await startHttpApp({
      registry: paid,
      port: 0,
      apiKeys: ["secret"],
      demoRegistry: demo,
      legacyErrors: false,
    });

    const locked = await fetch(`http://127.0.0.1:${app.port}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
      },
      body: "{}",
    });
    expect(locked.status).toBe(401);

    const demoHealth = await fetch(`http://127.0.0.1:${app.port}/demo/healthz`);
    expect(demoHealth.status).toBe(200);

    const url = new URL(`http://127.0.0.1:${app.port}/demo/mcp`);
    const client = new Client({ name: "mck-demo-e2e", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(url) as Transport);
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toContain("wiki_search");
    expect(names).toContain("echo");
    expect(names).not.toContain("web_search");
    expect(names).not.toContain("search_repositories");

    const echo = await client.callTool({ name: "echo", arguments: { message: "public-demo" } });
    expect(parseToolJson(echo)).toEqual({ echoed: "public-demo" });

    await client.close();
    await app.close();
  });
});
