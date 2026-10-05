import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { SourceRegistry } from "@mck/core";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createMcpServer, createStreamableTransport } from "./mcp-server.js";
import { metricsRegistry } from "./metrics.js";

export type HttpAppOptions = {
  registry: SourceRegistry;
  port: number;
  apiKeys?: string[];
  bodyLimitBytes?: number;
  corsOrigins?: string[];
  legacyErrors?: boolean;
};

/**
 * Serves MCP streamable HTTP plus health, readiness, and Prometheus metrics.
 */
export function startHttpApp(opts: HttpAppOptions): { close: () => Promise<void> } {
  const mcpOpts = opts.legacyErrors === true ? { legacyErrors: true } : {};
  const mcp = createMcpServer(opts.registry, mcpOpts);
  const transport = createStreamableTransport();
  void mcp.connect(transport as Transport);

  const server = createServer(async (req, res) => {
    try {
      applyCors(req, res, opts.corsOrigins ?? []);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      const path = req.url?.split("?")[0] ?? "/";
      if (path === "/healthz") {
        json(res, 200, { status: "ok" });
        return;
      }
      if (path === "/readyz") {
        json(res, 200, { sources: opts.registry.sourceHealth() });
        return;
      }
      if (path === "/metrics") {
        const body = await metricsRegistry.metrics();
        res.writeHead(200, { "content-type": metricsRegistry.contentType });
        res.end(body);
        return;
      }
      if (path === "/mcp" && req.method === "POST") {
        if (!authorize(req, opts.apiKeys)) {
          json(res, 401, { error: "unauthorized" });
          return;
        }
        const body = await readBody(req, opts.bodyLimitBytes ?? 1_000_000);
        await transport.handleRequest(req, res, body);
        return;
      }
      json(res, 404, { error: "not_found" });
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : "internal" });
    }
  });

  server.listen(opts.port);

  return {
    close: async () => {
      await mcp.close();
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    },
  };
}

function json(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(payload));
}

function applyCors(req: IncomingMessage, res: ServerResponse, origins: string[]): void {
  const origin = req.headers.origin;
  if (origin && (origins.length === 0 || origins.includes(origin))) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("access-control-allow-headers", "content-type, authorization, mcp-session-id");
    res.setHeader("access-control-allow-methods", "POST, GET, OPTIONS");
  }
}

function authorize(req: IncomingMessage, keys?: string[]): boolean {
  if (!keys?.length) return true;
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return keys.includes(token);
}

async function readBody(req: IncomingMessage, limit: number): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.from(chunk);
    size += buf.length;
    if (size > limit) throw new Error("body_too_large");
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  return JSON.parse(raw) as unknown;
}

export { metricsRegistry } from "./metrics.js";
