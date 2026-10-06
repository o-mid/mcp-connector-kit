import { createGatewayRegistry } from "./index.js";
import { loadConfig } from "./config.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { mockHttpJson, prepareMcpHttpE2eNetwork } from "@mck/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { startHttpApp } from "@mck/server";

beforeAll(() => {
  prepareMcpHttpE2eNetwork();
});

function parseToolJson(content: unknown): unknown {
  const block = (content as { content?: { type: string; text?: string }[] })?.content?.[0];
  expect(block?.type).toBe("text");
  if (block?.type !== "text" || !block.text) throw new Error("expected text tool result");
  return JSON.parse(block.text);
}

describe("gateway HTTP MCP e2e", () => {
  it("serves global-demo profile over Streamable HTTP", async () => {
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
        MCK_SOURCE_PROFILE: "global-demo",
        MCK_LEGACY_TOOL_NAMES: "true",
        LOG_LEVEL: "silent",
      }),
    );

    const app = await startHttpApp({ registry, port: 0, legacyErrors: false });
    const url = new URL(`http://127.0.0.1:${app.port}/mcp`);
    const transport = new StreamableHTTPClientTransport(url);
    const client = new Client({ name: "mck-gateway-e2e", version: "1.0.0" });
    await client.connect(transport);

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

  it("lists commerce-ir tools without calling upstream", async () => {
    const registry = createGatewayRegistry(
      loadConfig({
        MCK_SOURCE_PROFILE: "commerce-ir",
        MCK_LEGACY_TOOL_NAMES: "true",
        LOG_LEVEL: "silent",
      }),
    );

    const app = await startHttpApp({ registry, port: 0, legacyErrors: false });
    const url = new URL(`http://127.0.0.1:${app.port}/mcp`);
    const transport = new StreamableHTTPClientTransport(url);
    const client = new Client({ name: "mck-gateway-e2e", version: "1.0.0" });
    await client.connect(transport);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);
    expect(names).toContain("search_torob");
    expect(names).toContain("search_products");

    await client.close();
    await app.close();
  });
});
