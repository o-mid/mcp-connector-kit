"use client";

import { useEffect, useState } from "react";
import { GATEWAY_ORIGIN } from "@/lib/site";

type Payload = {
  ok?: boolean;
  fetchedAt?: string;
  health?: { status?: string; sku?: string };
  sources?: Record<string, string>;
  demo?: "on" | "off" | "unknown";
  metrics?: { name: string; value: number | null }[];
  error?: string;
};

export function StatusBoard() {
  const [data, setData] = useState<Payload | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/status");
        const body = (await res.json()) as Payload;
        if (!cancelled) setData(body);
      } catch {
        if (!cancelled) setData({ ok: false, error: "Could not reach the status route" });
      }
    }
    void load();
    const id = window.setInterval(() => void load(), 20000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const sources = Object.entries(data?.sources ?? {});

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Health" value={data?.health?.status ?? (data ? "down" : "…")} />
        <Stat label="SKU" value={data?.health?.sku ?? "…"} />
        <Stat
          label="Public demo"
          value={data?.demo === "on" ? "on" : data?.demo === "off" ? "off" : "…"}
        />
      </div>
      {data?.error ? <p className="text-sm text-red-300">{data.error}</p> : null}
      <div>
        <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">Sources</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {sources.map(([id, state]) => (
            <li
              key={id}
              className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3"
            >
              <span className="font-mono text-sm text-zinc-200">{id}</span>
              <span className={state === "healthy" ? "text-sm text-emerald-400" : "text-sm text-amber-300"}>{state}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">Metrics</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-500">
          Scraped from <span className="font-mono">{GATEWAY_ORIGIN}/metrics</span>. Empty counters mean no samples
          since the process started.
        </p>
        <ul className="mt-3 divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08]">
          {(data?.metrics ?? []).map((m) => (
            <li key={m.name} className="flex items-center justify-between gap-4 bg-black/20 px-4 py-3">
              <span className="font-mono text-xs text-zinc-300">{m.name}</span>
              <span className="font-mono text-sm text-white">{m.value === null ? "—" : m.value}</span>
            </li>
          ))}
        </ul>
      </div>
      {data?.fetchedAt ? (
        <p className="text-xs text-zinc-600">Updated {new Date(data.fetchedAt).toLocaleTimeString()}</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-zinc-950/50 px-4 py-4">
      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 font-mono text-lg text-white">{value}</p>
    </div>
  );
}
