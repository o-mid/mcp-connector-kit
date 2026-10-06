import { GATEWAY_ORIGIN } from "@/lib/site";
import { DEMO_PRESETS, DEMO_TOOL_NAMES, type CatalogDemo } from "@/generated/catalog";

export const dynamic = "force-dynamic";

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const LIMIT = 12;

type DemoTool = (typeof DEMO_TOOL_NAMES)[number];

function allow(ip: string): boolean {
  const now = Date.now();
  const prev = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (prev.length >= LIMIT) {
    hits.set(ip, prev);
    return false;
  }
  prev.push(now);
  hits.set(ip, prev);
  return true;
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "local";
}

function asTool(value: unknown): DemoTool | undefined {
  return DEMO_TOOL_NAMES.find((tool) => tool === value);
}

function presetFor(tool: DemoTool): CatalogDemo | undefined {
  return DEMO_PRESETS.find((p) => p.tool === tool);
}

function textField(input: Record<string, unknown>, key: string, max: number): string | undefined {
  const value = input[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > max) return undefined;
  return trimmed;
}

function limitField(input: Record<string, unknown>, fallback: number): number {
  const value = input.limit;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) return fallback;
  return n;
}

function argumentsFor(tool: DemoTool, input: Record<string, unknown>): Record<string, unknown> | undefined {
  const preset = presetFor(tool);
  if (!preset) return undefined;
  const field = preset.field;
  if (field === "query") {
    const query = textField(input, "query", 120);
    if (!query) return undefined;
    return { query, limit: limitField(input, 3) };
  }
  if (field === "place") {
    const place = textField(input, "place", 80);
    if (!place) return undefined;
    const days = input.days;
    const n = typeof days === "number" ? days : Number(days);
    return { place, days: Number.isInteger(n) && n >= 1 && n <= 3 ? n : 2 };
  }
  if (field === "symbols") {
    const base = (textField(input, "base", 3) ?? "USD").toUpperCase();
    if (!/^[A-Z]{3}$/.test(base)) return undefined;
    const raw = input.symbols;
    const parts = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
    const symbols = parts
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    if (symbols.length < 1 || symbols.length > 8 || symbols.some((code) => !/^[A-Z]{3}$/.test(code))) return undefined;
    return { base, symbols };
  }
  if (field === "code") {
    const code = (textField(input, "code", 2) ?? "").toUpperCase();
    if (!/^[A-Z]{2}$/.test(code)) return undefined;
    return { code };
  }
  return { limit: limitField(input, 3) };
}

async function readMcp(res: Response): Promise<unknown> {
  const type = res.headers.get("content-type") ?? "";
  const text = await res.text();
  if (!text) return undefined;
  if (type.includes("text/event-stream")) {
    const messages: unknown[] = [];
    for (const line of text.split("\n")) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload) continue;
      messages.push(JSON.parse(payload) as unknown);
    }
    return messages.at(-1);
  }
  return JSON.parse(text) as unknown;
}

function toolText(message: unknown): { text?: string; error?: string } {
  if (!message || typeof message !== "object") return {};
  const result = (message as { result?: { isError?: boolean; content?: { type?: string; text?: string }[] } }).result;
  const block = result?.content?.find((c) => c.type === "text" && typeof c.text === "string");
  if (!block?.text) return {};
  if (result?.isError) return { error: block.text };
  return { text: block.text };
}

async function gatewayCall(tool: DemoTool, args: Record<string, unknown>): Promise<unknown> {
  const url = `${GATEWAY_ORIGIN}/demo/mcp`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  };
  const initRes = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "mck-web", version: "1.0.0" },
      },
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (initRes.status === 404) throw new Error("demo_disabled");
  if (!initRes.ok) throw new Error(`initialize_${initRes.status}`);
  const session = initRes.headers.get("mcp-session-id");
  if (session) headers["mcp-session-id"] = session;
  await initRes.text();

  const noted = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    signal: AbortSignal.timeout(8000),
  });
  await noted.text();

  const callRes = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: tool, arguments: args },
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!callRes.ok) throw new Error(`call_${callRes.status}`);
  const parsed = toolText(await readMcp(callRes));
  if (parsed.error) throw new Error(parsed.error);
  if (!parsed.text) throw new Error("empty_tool_result");
  return JSON.parse(parsed.text) as unknown;
}

async function wikipediaDirect(query: string, limit: number) {
  const endpoint = new URL("https://en.wikipedia.org/w/api.php");
  endpoint.searchParams.set("action", "opensearch");
  endpoint.searchParams.set("search", query);
  endpoint.searchParams.set("limit", String(limit));
  endpoint.searchParams.set("namespace", "0");
  endpoint.searchParams.set("format", "json");
  const res = await fetch(endpoint, {
    headers: {
      accept: "application/json",
      "user-agent": "mck-web-demo/1.0 (+https://github.com/o-mid/mcp-connector-kit; read-only)",
    },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`wikipedia_${res.status}`);
  const data = (await res.json()) as [string, string[], string[], string[]];
  const titles = data[1];
  const descriptions = data[2];
  const urls = data[3];
  return {
    query: data[0],
    results: titles.map((title, i) => ({
      title,
      description: descriptions[i] || null,
      url: urls[i] || null,
    })),
  };
}

export async function POST(request: Request) {
  if (!allow(clientIp(request))) {
    return Response.json({ error: "Too many calls from this network. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const legacyQuery = typeof record.query === "string" ? record.query : undefined;
  const tool = asTool(record.tool) ?? (legacyQuery ? "wiki_search" : undefined);
  if (!tool) return Response.json({ error: "Unknown tool." }, { status: 400 });
  const input =
    record.input && typeof record.input === "object"
      ? (record.input as Record<string, unknown>)
      : legacyQuery
        ? { query: legacyQuery, limit: 3 }
        : {};
  const args = argumentsFor(tool, input);
  if (!args) return Response.json({ error: "Check the fields for this tool." }, { status: 400 });

  try {
    const data = await gatewayCall(tool, args);
    return Response.json({ via: "gateway", tool, data });
  } catch (err) {
    if (tool !== "wiki_search") {
      const message = err instanceof Error ? err.message : "call_failed";
      return Response.json({ error: message }, { status: 502 });
    }
    try {
      const data = await wikipediaDirect(String(args.query), Number(args.limit));
      return Response.json({ via: "wikipedia", tool, data });
    } catch (fallbackErr) {
      return Response.json(
        { error: fallbackErr instanceof Error ? fallbackErr.message : "search_failed" },
        { status: 502 },
      );
    }
  }
}
