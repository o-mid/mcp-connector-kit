import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { parseFirstTextJson, asCallToolResult } from "@mck/testing";
import { describe, expect, it } from "vitest";

const gatewayRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(gatewayRoot, "dist/cli.js");

describe("gateway stdio MCP e2e", () => {
  it("lists tools and calls echo over stdio", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [entry],
      cwd: gatewayRoot,
      env: {
        ...getDefaultEnvironment(),
        MCK_SOURCES: "fixture",
        MCK_LEGACY_TOOL_NAMES: "true",
        LOG_LEVEL: "silent",
      },
      stderr: "pipe",
    });
    const client = new Client({ name: "mck-gateway-stdio-e2e", version: "1.0.0" });
    await client.connect(transport);

    const listed = await client.listTools();
    expect(listed.tools.map((t) => t.name)).toContain("echo");

    expect(
      parseFirstTextJson(
        asCallToolResult(
          await client.callTool({ name: "echo", arguments: { message: "gateway-stdio" } }),
        ),
      ),
    ).toEqual({ echoed: "gateway-stdio" });

    await client.close();
  }, 25_000);
});
