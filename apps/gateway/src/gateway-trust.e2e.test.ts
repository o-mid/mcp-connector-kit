import { createGatewayRegistry } from "./index.js";
import { loadConfig } from "./config.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { mockHttpJson, prepareMcpHttpE2eNetwork } from "@mck/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { startHttpApp } from "@mck/server";

beforeAll(() => {
  prepareMcpHttpE2eNetwork();
  process.env.BRAVE_API_KEY = process.env.BRAVE_API_KEY ?? "e2e-test-key";
});

describe("trust tier HTTP MCP e2e", () => {
  it("runs paid SKU trust profile tools with offline mocks", async () => {
    mockHttpJson({
      origin: "https://api.github.com",
      pathPrefix: "/search/repositories",
      body: {
        items: [
          {
            full_name: "modelcontextprotocol/specification",
            html_url: "https://github.com/modelcontextprotocol/specification",
            description: "MCP spec",
            stargazers_count: 100,
          },
        ],
      },
    });
    mockHttpJson({
      origin: "https://api.search.brave.com",
      pathPrefix: "/res/v1/web/search",
      body: {
        web: {
          results: [
            {
              title: "MCP",
              url: "https://modelcontextprotocol.io/",
              description: "Protocol site",
            },
          ],
        },
      },
    });
    mockHttpJson({
      origin: "https://example.com",
      pathPrefix: "/",
      body: "<html><body><p>Trust tier e2e</p></body></html>",
    });

    const registry = createGatewayRegistry(
      loadConfig({
        MCK_SOURCE_PROFILE: "trust",
        MCK_SKU: "paid",
        MCK_LEGACY_TOOL_NAMES: "true",
        MCK_WEB_READER_ALLOWLIST: "https://example.com",
        LOG_LEVEL: "silent",
      }),
    );

    const app = await startHttpApp({ registry, port: 0, legacyErrors: false });
    const url = new URL(`http://127.0.0.1:${app.port}/mcp`);
    const client = new Client({ name: "mck-trust-e2e", version: "1.0.0" });
    await client.connect(new StreamableHTTPClientTransport(url));

    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toContain("search_repositories");
    expect(names).toContain("web_search");
    expect(names).toContain("fetch_page");

    const repos = await client.callTool({
      name: "search_repositories",
      arguments: { query: "mcp", limit: 1 },
    });
    const block = repos.content?.[0];
    expect(block?.type).toBe("text");
    if (block?.type === "text") {
      const data = JSON.parse(block.text) as { repositories: unknown[] };
      expect(data.repositories.length).toBe(1);
    }

    await client.close();
    await app.close();
  });

  it("free SKU hides paid-only sources on trust profile", async () => {
    const registry = createGatewayRegistry(
      loadConfig({
        MCK_SOURCE_PROFILE: "trust",
        MCK_SKU: "free",
        MCK_LEGACY_TOOL_NAMES: "true",
        LOG_LEVEL: "silent",
      }),
    );
    const names = registry.listToolNames();
    expect(names.some((n) => n.includes("github"))).toBe(false);
    expect(names.some((n) => n.includes("wikipedia"))).toBe(true);
  });
});
