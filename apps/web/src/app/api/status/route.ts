import { GATEWAY_ORIGIN } from "@/lib/site";

export const dynamic = "force-dynamic";

const METRIC_NAMES = [
  "mck_tool_calls_total",
  "mck_cache_hits_total",
  "mck_schema_drift_total",
  "mck_unknown_fields_total",
] as const;

type MetricRow = { name: string; value: number | null };

function parseMetrics(text: string): MetricRow[] {
  const totals = new Map<string, number>();
  const seen = new Set<string>();
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) {
      const help = line.match(/^# HELP (\S+)/);
      if (help?.[1] && METRIC_NAMES.includes(help[1] as (typeof METRIC_NAMES)[number])) seen.add(help[1]);
      continue;
    }
    const match = line.match(/^([a-zA-Z_:][\w:]*)(?:\{[^}]*\})?\s+(\S+)/);
    if (!match?.[1] || !match[2]) continue;
    const name = match[1];
    if (!METRIC_NAMES.includes(name as (typeof METRIC_NAMES)[number])) continue;
    const value = Number(match[2]);
    if (!Number.isFinite(value)) continue;
    seen.add(name);
    totals.set(name, (totals.get(name) ?? 0) + value);
  }
  return METRIC_NAMES.filter((name) => seen.has(name)).map((name) => ({
    name,
    value: totals.has(name) ? totals.get(name)! : null,
  }));
}

async function getJson(url: string): Promise<{ status: number; body: unknown }> {
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  const text = await res.text();
  try {
    return { status: res.status, body: JSON.parse(text) as unknown };
  } catch {
    return { status: res.status, body: text };
  }
}

export async function GET() {
  const fetchedAt = new Date().toISOString();
  try {
    const [healthRes, readyRes, metricsRes, demoRes] = await Promise.all([
      getJson(`${GATEWAY_ORIGIN}/healthz`),
      getJson(`${GATEWAY_ORIGIN}/readyz`),
      fetch(`${GATEWAY_ORIGIN}/metrics`, { cache: "no-store", signal: AbortSignal.timeout(8000) }).then(async (r) => ({
        ok: r.ok,
        text: await r.text(),
      })),
      getJson(`${GATEWAY_ORIGIN}/demo/healthz`),
    ]);

    const health =
      healthRes.body && typeof healthRes.body === "object"
        ? (healthRes.body as { status?: string; sku?: string })
        : undefined;
    const ready =
      readyRes.body && typeof readyRes.body === "object"
        ? (readyRes.body as { sources?: Record<string, string> })
        : undefined;
    const demo = demoRes.status === 200 ? "on" : demoRes.status === 404 ? "off" : "unknown";

    return Response.json({
      ok: healthRes.status === 200 && health?.status === "ok",
      fetchedAt,
      health,
      sources: ready?.sources ?? {},
      demo,
      metrics: metricsRes.ok ? parseMetrics(metricsRes.text) : [],
    });
  } catch (err) {
    return Response.json(
      {
        ok: false,
        fetchedAt,
        demo: "unknown",
        metrics: [],
        error: err instanceof Error ? err.message : "status_fetch_failed",
      },
      { status: 502 },
    );
  }
}
