import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  StdioClientTransport,
  getDefaultEnvironment,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import { describe, expect, it } from "vitest";

const serverRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const entry = path.join(serverRoot, "dist/e2e/fixture-stdio-entry.js");

describe("MCP stdio e2e", () => {
  it("lists tools and calls echo over stdio", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [entry],
      cwd: serverRoot,
      env: getDefaultEnvironment(),
      stderr: "pipe",
    });
    const client = new Client({ name: "mck-test", version: "1.0.0" });
    await client.connect(transport);

    const listed = await client.listTools();
    expect(listed.tools.map((t) => t.name)).toContain("echo");

    const result = (await client.callTool({
      name: "echo",
      arguments: { message: "mcp-stdio" },
    })) as CallToolResult;
    const block = result.content[0];
    expect(block?.type).toBe("text");
    if (block?.type === "text") {
      expect(JSON.parse(block.text)).toEqual({ echoed: "mcp-stdio" });
    }

    await client.close();
  }, 20_000);
});
