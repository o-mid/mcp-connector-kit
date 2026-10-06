import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageIntro } from "@/components/page-intro";
import { SourceConnect } from "@/components/source-connect";
import { CATALOG_SOURCES, getCatalogSource } from "@/generated/catalog";
import { GITHUB_REPO, TRUST_TIER_DOC } from "@/lib/site";

export function generateStaticParams() {
  return CATALOG_SOURCES.map((s) => ({ id: s.id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const source = getCatalogSource(id);
  if (!source) return { title: "Source" };
  return {
    title: source.title,
    description: `${source.title} MCP source: ${source.tools.map((t) => t.name).join(", ")}.`,
  };
}

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const source = getCatalogSource(id);
  if (!source) notFound();

  const githubDir = `${GITHUB_REPO}/tree/main/sources/${source.id}`;
  const fixtures = `${GITHUB_REPO}/tree/main/sources/${source.id}/fixtures`;

  return (
    <>
      <PageIntro
        kicker={source.package}
        title={source.title}
        lede={`${source.note}. ${source.tier === "free" ? "Included in the free SKU and the public demo." : "Paid SKU only — needs an upstream credential or allowlist."}`}
      />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                  source.tier === "free"
                    ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                    : "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20"
                }`}
              >
                {source.tier}
              </span>
              <span className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400">
                {source.id}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">Tools</h2>
              <ul className="mt-3 space-y-2">
                {source.tools.map((tool) => (
                  <li key={tool.name} className="rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-3">
                    <p className="font-mono text-sm text-white">{tool.name}</p>
                    <p className="mt-1 text-sm text-zinc-400">{tool.description}</p>
                    <p className="mt-2 font-mono text-xs text-zinc-600">
                      {source.id}.{tool.name}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-medium uppercase tracking-[0.16em] text-zinc-500">Upstream hosts</h2>
              {source.hosts.length > 0 ? (
                <ul className="mt-3 space-y-1 font-mono text-sm text-zinc-300">
                  {source.hosts.map((host) => (
                    <li key={host}>{host}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">
                  Allowlist from <span className="font-mono text-zinc-200">MCK_WEB_READER_ALLOWLIST</span>.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-sm">
              <a href={githubDir} className="text-zinc-200 underline-offset-4 hover:underline">
                sources/{source.id}/
              </a>
              <a href={fixtures} className="text-zinc-200 underline-offset-4 hover:underline">
                fixtures
              </a>
              <a href={`${TRUST_TIER_DOC}#trust-tier-sources`} className="text-zinc-200 underline-offset-4 hover:underline">
                Trust tier
              </a>
              <Link href="/sources" className="text-zinc-400 underline-offset-4 hover:underline">
                All sources
              </Link>
            </div>
          </div>
          <SourceConnect sourceId={source.id} title={source.title} tier={source.tier} />
        </div>
      </section>
    </>
  );
}
