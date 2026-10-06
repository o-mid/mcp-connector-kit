import { createDefaultCache, createSourceRegistry } from "@mck/core";
import { fixtureSource } from "@mck/source-fixture";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { prepareMcpHttpE2eNetwork } from "@mck/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { startHttpApp } from "./http-app.js";

beforeAll(() => {
  prepareMcpHttpE2eNetwork();
});

describe("MCP streamable HTTP e2e", () => {
  it("lists tools and calls fixture.echo", async () => {
    const registry = createSourceRegistry([fixtureSource], {
      cache: createDefaultCache(),
      legacyToolNames: true,
    });
    const app = await startHttpApp({ registry, port: 0 });
    const url = new URL(`http://127.0.0.1:${app.port}/mcp`);

    const transport = new StreamableHTTPClientTransport(url);
    const client = new Client({ name: "mck-test", version: "1.0.0" });
    await client.connect(transport);

    const listed = await client.listTools();
    const names = listed.tools.map((t) => t.name);
    expect(names).toContain("echo");
    expect(names).toContain("health");

    const result = await client.callTool({ name: "echo", arguments: { message: "mcp-http" } });
    const text = result.content?.[0];
    expect(text?.type).toBe("text");
    if (text?.type === "text") {
      expect(JSON.parse(text.text)).toEqual({ echoed: "mcp-http" });
    }

    await client.close();
    await app.close();
  });
});
