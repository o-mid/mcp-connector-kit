import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { CATALOG_SOURCES, SOURCE_PROFILES } from "@/generated/catalog";
import { PROFILE_EXAMPLES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sources",
  description: "Contract-tested MCP sources in the MCP Connector Kit catalog, free and paid.",
};

export default function SourcesPage() {
  const free = CATALOG_SOURCES.filter((s) => s.tier === "free");
  const paid = CATALOG_SOURCES.filter((s) => s.tier === "paid");

  return (
    <>
      <PageIntro
        kicker="Catalog"
        title="Every source in the gateway."
        lede="Free is keyless. Paid adds GitHub, search, and allowlisted fetch. Each page lists tools, upstream hosts, and a Cursor install link."
      />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <SourceGroup title="Free" sources={free} />
          <SourceGroup title="Paid" sources={paid} />
          <div>
            <h2 className="text-xl font-semibold text-white">Source profiles</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-400">
              Named bundles for self-host. <span className="font-mono text-zinc-200">default</span> is the free list.
              <span className="font-mono text-zinc-200"> trust</span> is the full catalog (paid SKU).
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {PROFILE_EXAMPLES.map((p) => (
                <li key={p.name} className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5">
                  <p className="font-mono text-sm text-white">{p.env}</p>
                  <p className="mt-2 text-sm text-zinc-400">{p.ids.join(", ")}</p>
                </li>
              ))}
              <li className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5">
                <p className="font-mono text-sm text-white">MCK_SOURCE_PROFILE=trust</p>
                <p className="mt-2 text-sm text-zinc-400">
                  Full catalog ({SOURCE_PROFILES.trust.length} sources). Set{" "}
                  <span className="font-mono text-zinc-300">MCK_SKU=paid</span>.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function SourceGroup({
  title,
  sources,
}: {
  title: string;
  sources: typeof CATALOG_SOURCES;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sources.map((s) => (
          <li key={s.id}>
            <Link
              href={`/sources/${s.id}`}
              className="block h-full rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-5 transition hover:border-white/15 hover:bg-zinc-900/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-white">{s.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    s.tier === "free"
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20"
                  }`}
                >
                  {s.tier}
                </span>
              </div>
              <p className="mt-3 font-mono text-xs leading-relaxed text-zinc-500">
                {s.tools.map((t) => t.name).join(" · ")}
              </p>
              <p className="mt-2 text-xs text-zinc-600">{s.note}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
