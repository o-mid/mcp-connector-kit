import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { runWithAuditContextAsync, type SourceRegistry } from "@mck/core";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { createMcpServer, createStreamableTransport } from "./mcp-server.js";
import { metricsRegistry } from "./metrics.js";
import { authenticateMcpRequest, oauthProtectedResourceMetadata, type OAuthConfig } from "./oauth.js";

export type HttpAppOptions = {
  registry: SourceRegistry;
  port: number;
  apiKeys?: string[];
  oauth?: OAuthConfig;
  publicBaseUrl?: string;
  gatewaySku?: string;
  bodyLimitBytes?: number;
  corsOrigins?: string[];
  legacyErrors?: boolean;
  /** Unauthenticated MCP for the public Wikipedia demo. Omit to disable `/demo/mcp`. */
  demoRegistry?: SourceRegistry;
};

/**
 * Serves MCP streamable HTTP plus health, readiness, and Prometheus metrics.
 */
export async function startHttpApp(opts: HttpAppOptions): Promise<{
  close: () => Promise<void>;
  port: number;
}> {
  const mcpOpts = opts.legacyErrors === true ? { legacyErrors: true } : {};
  const mcpSessions = new Map<string, McpSession>();
  const demoSessions = new Map<string, McpSession>();
  const demoHits = new Map<string, number[]>();

  const baseUrl = opts.publicBaseUrl ?? `http://127.0.0.1:${opts.port}`;

  const server = createServer((req, res) => {
    void handleHttpRequest(req, res);
  });

  async function handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      applyCors(req, res, opts.corsOrigins ?? []);
      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }
      const path = req.url?.split("?")[0] ?? "/";
      if (path === "/healthz") {
        json(res, 200, { status: "ok", sku: opts.gatewaySku ?? "self-host" });
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
      if (path === "/demo/healthz") {
        if (!opts.demoRegistry) {
          json(res, 404, { demo: false });
          return;
        }
        json(res, 200, { demo: true, sources: opts.demoRegistry.sourceHealth() });
        return;
      }
      if (path === "/demo/mcp" && req.method && ["POST", "GET", "DELETE"].includes(req.method)) {
        if (!opts.demoRegistry) {
          json(res, 404, { error: "demo_disabled" });
          return;
        }
        const body = req.method === "POST" ? await readBody(req, opts.bodyLimitBytes ?? 1_000_000) : undefined;
        if (req.method === "POST" && isToolCall(body) && !allowDemoPost(demoHits, clientIp(req))) {
          json(res, 429, { error: "rate_limited" });
          return;
        }
        await handleMcpSession(req, res, body, demoSessions, opts.demoRegistry, {
          ...mcpOpts,
          name: "mck-demo",
        });
        return;
      }
      if (path === "/.well-known/oauth-protected-resource" && opts.oauth?.jwksUrl) {
        json(res, 200, oauthProtectedResourceMetadata(baseUrl, opts.oauth));
        return;
      }
      if (path === "/mcp" && req.method === "POST") {
        const auth = await authenticateMcpRequest(req, { apiKeys: opts.apiKeys, oauth: opts.oauth });
        if (!auth.ok) {
          json(res, 401, { error: "unauthorized" });
          return;
        }
        const body = await readBody(req, opts.bodyLimitBytes ?? 1_000_000);
        const auditCtx =
          auth.tenantId !== undefined ? { tenantId: auth.tenantId } : {};
        await runWithAuditContextAsync(auditCtx, async () => {
          await handleMcpSession(req, res, body, mcpSessions, opts.registry, {
            ...mcpOpts,
            name: "mck-gateway",
          });
        });
        return;
      }
      json(res, 404, { error: "not_found" });
    } catch (err) {
      json(res, 500, { error: err instanceof Error ? err.message : "internal" });
    }
  }

  await new Promise<void>((resolve) => {
    server.listen(opts.port, () => { resolve(); });
  });
  const addr = server.address();
  const port =
    typeof addr === "object" && addr && "port" in addr ? addr.port : opts.port;

  return {
    port,
    close: async () => {
      await closeSessions(mcpSessions);
      await closeSessions(demoSessions);
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    },
  };
}

type McpSession = {
  transport: ReturnType<typeof createStreamableTransport>;
  close: () => Promise<void>;
  touched: number;
};

const SESSION_TTL_MS = 120_000;

function sessionHeader(req: IncomingMessage): string | undefined {
  const raw = req.headers["mcp-session-id"];
  const value = Array.isArray(raw) ? raw[0] : raw;
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isInitialize(body: unknown): boolean {
  if (Array.isArray(body)) return body.some((item) => isInitialize(item));
  if (!body || typeof body !== "object") return false;
  return (body as { method?: unknown }).method === "initialize";
}

function isToolCall(body: unknown): boolean {
  if (Array.isArray(body)) return body.some((item) => isToolCall(item));
  if (!body || typeof body !== "object") return false;
  return (body as { method?: unknown }).method === "tools/call";
}

function sweepSessions(sessions: Map<string, McpSession>): void {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.touched < SESSION_TTL_MS) continue;
    sessions.delete(id);
    void session.close().catch(() => undefined);
  }
}

async function closeSessions(sessions: Map<string, McpSession>): Promise<void> {
  const open = [...sessions.values()];
  sessions.clear();
  await Promise.all(open.map((session) => session.close().catch(() => undefined)));
}

/** One Streamable HTTP transport per client. A shared transport rejects the second initialize. */
async function handleMcpSession(
  req: IncomingMessage,
  res: ServerResponse,
  body: unknown,
  sessions: Map<string, McpSession>,
  registry: SourceRegistry,
  serverOpts: { name: string; legacyErrors?: boolean },
): Promise<void> {
  sweepSessions(sessions);
  const existingId = sessionHeader(req);
  const existing = existingId ? sessions.get(existingId) : undefined;
  if (existing) {
    existing.touched = Date.now();
    await existing.transport.handleRequest(req, res, body);
    if (req.method === "DELETE" && existingId) {
      sessions.delete(existingId);
      await existing.close();
    }
    return;
  }
  if (req.method !== "POST" || !isInitialize(body)) {
    json(res, 400, { error: "missing_session" });
    return;
  }
  const server = createMcpServer(registry, serverOpts);
  const transport = createStreamableTransport();
  await server.connect(transport as Transport);
  try {
    await transport.handleRequest(req, res, body);
  } catch (err) {
    await server.close().catch(() => undefined);
    throw err;
  }
  const id = transport.sessionId;
  if (id) {
    sessions.set(id, { transport, close: () => server.close(), touched: Date.now() });
    return;
  }
  await server.close().catch(() => undefined);
}

const DEMO_WINDOW_MS = 60_000;
const DEMO_POSTS_PER_WINDOW = 30;

function clientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const first = raw?.split(",")[0]?.trim();
  return first || req.socket.remoteAddress || "unknown";
}

function allowDemoPost(hits: Map<string, number[]>, ip: string): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) ?? []).filter((t) => now - t < DEMO_WINDOW_MS);
  if (prev.length >= DEMO_POSTS_PER_WINDOW) {
    hits.set(ip, prev);
    return false;
  }
  prev.push(now);
  hits.set(ip, prev);
  return true;
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

async function readBody(req: IncomingMessage, limit: number): Promise<unknown> {
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > limit) throw new Error("body_too_large");
    chunks.push(buf);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return undefined;
  return JSON.parse(raw) as unknown;
}

export { metricsRegistry } from "./metrics.js";
export { isOAuthEnabled, oauthProtectedResourceMetadata } from "./oauth.js";
