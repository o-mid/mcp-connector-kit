const sources = [
  { name: "Wikipedia", tools: "wiki_search, wiki_summary", tier: "free" },
  { name: "GitHub", tools: "search repos & issues", tier: "paid" },
  { name: "Brave / Exa / Tavily", tools: "web_search, exa_search, tavily_search", tier: "paid" },
  { name: "Web reader", tools: "fetch_page (allowlist)", tier: "paid" },
  { name: "Fixture", tools: "echo (CI)", tier: "free" },
];

export function SourcesGrid() {
  return (
    <section id="sources" className="border-t border-white/5 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-3xl font-semibold text-white">Trust-tier sources</h2>
        <p className="mt-3 max-w-2xl text-slate-400">
          Each package ships <code className="font-mono text-cyan-200/90">fixtures/*.contract.json</code> replayed in CI
          with undici mocks—style borrowed from rigorous OSS API clients, not ad-hoc scripts.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sources.map((s) => (
            <article
              key={s.name}
              className="rounded-xl border border-white/10 bg-surface p-5 transition hover:border-cyan-400/25 hover:bg-surface-hover"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-medium text-white">{s.name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    s.tier === "free"
                      ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20"
                      : "bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/20"
                  }`}
                >
                  {s.tier}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-slate-500">{s.tools}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
