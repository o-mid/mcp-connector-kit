import { GATEWAY_ORIGIN } from "@/lib/site";

export const dynamic = "force-dynamic";

type WikiResult = {
  query: string;
  results: { title: string; description: string | null; url: string | null }[];
};

const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
const LIMIT = 12;

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

function toolText(message: unknown): string | undefined {
  if (!message || typeof message !== "object") return undefined;
  const result = (message as { result?: { content?: { type?: string; text?: string }[] } }).result;
  const block = result?.content?.find((c) => c.type === "text" && typeof c.text === "string");
  return block?.text;
}

async function gatewayWikiSearch(query: string, limit: number): Promise<WikiResult> {
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
      params: { name: "wiki_search", arguments: { query, limit } },
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!callRes.ok) throw new Error(`call_${callRes.status}`);
  const message = await readMcp(callRes);
  const text = toolText(message);
  if (!text) throw new Error("empty_tool_result");
  return JSON.parse(text) as WikiResult;
}

async function wikipediaDirect(query: string, limit: number): Promise<WikiResult> {
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
  const titles = data[1] ?? [];
  const descriptions = data[2] ?? [];
  const urls = data[3] ?? [];
  return {
    query: data[0] ?? query,
    results: titles.map((title, i) => ({
      title,
      description: descriptions[i] ?? null,
      url: urls[i] ?? null,
    })),
  };
}

export async function POST(request: Request) {
  if (!allow(clientIp(request))) {
    return Response.json({ error: "Too many searches from this network. Wait a minute." }, { status: 429 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Expected JSON" }, { status: 400 });
  }
  const query = body && typeof body === "object" && "query" in body ? String((body as { query: unknown }).query) : "";
  const trimmed = query.trim();
  if (trimmed.length < 1 || trimmed.length > 120) {
    return Response.json({ error: "Query must be 1–120 characters." }, { status: 400 });
  }

  try {
    const data = await gatewayWikiSearch(trimmed, 5);
    return Response.json({ via: "gateway", tool: "wiki_search", data });
  } catch {
    try {
      const data = await wikipediaDirect(trimmed, 5);
      return Response.json({ via: "wikipedia", tool: "wiki_search", data });
    } catch (err) {
      return Response.json(
        { error: err instanceof Error ? err.message : "search_failed" },
        { status: 502 },
      );
    }
  }
}
