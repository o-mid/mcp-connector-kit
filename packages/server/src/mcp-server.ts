import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { SourceRegistry } from "@mck/core";
import { zodInputShape } from "./zod-shape.js";

const READONLY = { readOnlyHint: true, openWorldHint: true } as const;

/**
 * Binds a source registry to the official MCP server with legacy naming options.
 */
export function createMcpServer(
  registry: SourceRegistry,
  opts?: { name?: string; version?: string; legacyErrors?: boolean },
): McpServer {
  const server = new McpServer({
    name: opts?.name ?? "mck-gateway",
    version: opts?.version ?? "1.0.0",
  });

  // Public names may be qualified (wikipedia.wiki_search) or legacy bare names (wiki_search).
  for (const publicName of registry.listToolNames()) {
    const tool = registry.listTools().find(
      (t) => t.qualifiedName === publicName || t.legacyName === publicName,
    );
    if (!tool) continue;
    server.registerTool(
      publicName,
      {
        description: tool.description,
        inputSchema: zodInputShape(tool.inputSchema),
        annotations: READONLY,
      },
      async (args, extra) => {
        const result = await registry.callTool(publicName, args, extra.signal);
        if (!result.ok) {
          const text = result.legacyErrorShape
            ? JSON.stringify({ error: result.error.message }, null, 2)
            : JSON.stringify(result.error);
          return { content: [{ type: "text", text }], isError: true };
        }
        const space = result.legacyPretty ? 2 : 0;
        return { content: [{ type: "text", text: JSON.stringify(result.data, null, space) }] };
      },
    );
  }

  return server;
}

export async function connectStdio(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

export function createStreamableTransport(): StreamableHTTPServerTransport {
  return new StreamableHTTPServerTransport({
    sessionIdGenerator: () => crypto.randomUUID(),
  });
}
