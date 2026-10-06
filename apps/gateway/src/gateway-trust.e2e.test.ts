import { createGatewayRegistry } from "./index.js";
import { loadConfig } from "./config.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  asCallToolResult,
  mockHttpJson,
  parseFirstTextJson,
  prepareMcpHttpE2eNetwork,
} from "@mck/testing";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { beforeAll, describe, expect, it } from "vitest";
import { startHttpApp } from "@mck/server";

beforeAll(() => {
  prepareMcpHttpE2eNetwork();
  process.env.BRAVE_API_KEY = process.env.BRAVE_API_KEY ?? "e2e-test-key";
  process.env.EXA_API_KEY = process.env.EXA_API_KEY ?? "e2e-test-key";
  process.env.TAVILY_API_KEY = process.env.TAVILY_API_KEY ?? "e2e-test-key";
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
    mockHttpJson({
      origin: "https://api.exa.ai",
      pathPrefix: "/search",
      method: "POST",
      body: {
        results: [{ title: "MCP", url: "https://modelcontextprotocol.io/", text: "Protocol" }],
      },
    });
    mockHttpJson({
      origin: "https://api.tavily.com",
      pathPrefix: "/search",
      method: "POST",
      body: {
        results: [{ title: "Tavily MCP", url: "https://modelcontextprotocol.io/", content: "Docs" }],
      },
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
    await client.connect(new StreamableHTTPClientTransport(url) as Transport);

    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toContain("search_repositories");
    expect(names).toContain("web_search");
    expect(names).toContain("fetch_page");
    expect(names).toContain("exa_search");
    expect(names).toContain("tavily_search");

    const repos = parseFirstTextJson(
      asCallToolResult(
        await client.callTool({
          name: "search_repositories",
          arguments: { query: "mcp", limit: 1 },
        }),
      ),
    ) as { repositories: unknown[] };
    expect(repos.repositories.length).toBe(1);

    const search = parseFirstTextJson(
      asCallToolResult(
        await client.callTool({
          name: "web_search",
          arguments: { query: "MCP", limit: 1 },
        }),
      ),
    ) as { results: unknown[] };
    expect(search.results.length).toBeGreaterThan(0);

    const page = parseFirstTextJson(
      asCallToolResult(
        await client.callTool({
          name: "fetch_page",
          arguments: { url: "https://example.com/page", max_chars: 1000 },
        }),
      ),
    ) as { content: string };
    expect(page.content).toContain("Trust tier e2e");

    const exa = parseFirstTextJson(
      asCallToolResult(
        await client.callTool({
          name: "exa_search",
          arguments: { query: "MCP", limit: 1 },
        }),
      ),
    ) as { results: unknown[] };
    expect(exa.results.length).toBe(1);

    const tavily = parseFirstTextJson(
      asCallToolResult(
        await client.callTool({
          name: "tavily_search",
          arguments: { query: "MCP", limit: 1 },
        }),
      ),
    ) as { results: unknown[] };
    expect(tavily.results.length).toBe(1);

    await client.close();
    await app.close();
  });

  it("free SKU hides paid-only sources on trust profile", () => {
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
