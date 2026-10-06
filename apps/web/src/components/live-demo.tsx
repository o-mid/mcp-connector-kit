"use client";

import { useState } from "react";

type DemoResponse = {
  via?: "gateway" | "wikipedia";
  tool?: string;
  data?: {
    query: string;
    results: { title: string; description: string | null; url: string | null }[];
  };
  error?: string;
};

export function LiveDemo() {
  const [query, setQuery] = useState("Model Context Protocol");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResponse | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query }),
      });
      setResult((await res.json()) as DemoResponse);
    } catch {
      setResult({ error: "Request failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-zinc-950/60 p-6 sm:p-8">
      <form onSubmit={(e) => void run(e)} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="wiki-query">
          Wikipedia search
        </label>
        <input
          id="wiki-query"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none ring-violet-400/40 placeholder:text-zinc-600 focus:ring-2"
        />
        <button
          type="submit"
          disabled={loading || query.trim().length === 0}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Searching" : "Run wiki_search"}
        </button>
      </form>
      {result?.error ? <p className="mt-4 text-sm text-red-300">{result.error}</p> : null}
      {result?.data ? (
        <div className="mt-6 space-y-4">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
            {result.tool} · {result.via === "gateway" ? "gateway /demo/mcp" : "Wikipedia opensearch, same output shape"}
          </p>
          <ul className="space-y-3">
            {result.data.results.map((row) => (
              <li key={row.url ?? row.title} className="rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3">
                <p className="font-medium text-white">{row.title}</p>
                {row.description ? <p className="mt-1 text-sm text-zinc-400">{row.description}</p> : null}
                {row.url ? (
                  <a href={row.url} className="mt-2 inline-block font-mono text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline">
                    {row.url}
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
          <pre className="overflow-x-auto rounded-2xl border border-white/[0.06] bg-black/40 p-4 font-mono text-xs leading-relaxed text-zinc-300">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
