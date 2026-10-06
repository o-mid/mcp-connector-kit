"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Status = {
  ok?: boolean;
  health?: { status?: string; sku?: string };
  sources?: Record<string, string>;
};

export function GatewayPill() {
  const [status, setStatus] = useState<Status | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status")
      .then((r) => r.json() as Promise<Status>)
      .then((body) => {
        if (!cancelled) setStatus(body);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sources = status?.sources ? Object.keys(status.sources) : [];
  const healthy = status?.sources
    ? Object.values(status.sources).filter((s) => s === "healthy").length
    : 0;
  const live = status?.ok && status.health?.status === "ok";

  return (
    <Link
      href="/status"
      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium tracking-wide text-zinc-300 transition hover:border-white/20 hover:text-white"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400" : failed ? "bg-red-400" : "bg-zinc-500"}`} />
      {live
        ? `${status.health?.sku ?? "gateway"} · ${healthy}/${sources.length} sources healthy`
        : failed
          ? "Gateway status unavailable"
          : "Checking gateway"}
    </Link>
  );
}
