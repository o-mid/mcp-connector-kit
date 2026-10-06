import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { GITHUB_REPO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free keyless sources versus the paid trust-tier SKU. No checkout on this site.",
};

const FREE = [
  "Wikipedia, weather, rates, papers, books, Hacker News, earthquakes, country profiles, fixture",
  "wiki_search, weather_forecast, fx_latest, paper_search, book_search, hn_search, recent_quakes, country_profile",
  "Public demo at /demo/mcp when MCK_PUBLIC_DEMO=true",
  "Best-effort hosted uptime",
  "Contract fixtures in CI",
];

const PAID = [
  "Full trust tier: GitHub, Brave, Exa, Tavily, web reader",
  "API keys required on /mcp",
  "2× token-bucket headroom",
  "Audit log line per tool call (MCK_AUDIT_LOG)",
  "Tenant id in that log (MCK_TENANT_ID or JWT sub)",
  "Optional JWT check against your IdP JWKS",
];

export default function PricingPage() {
  return (
    <>
      <PageIntro
        kicker="Pricing"
        title="Two SKUs. No card form."
        lede="Free is the keyless catalog. Paid adds GitHub, search, and allowlisted fetch, with keys, audit, and higher limits. Hosted paid is an operator setting (MCK_SKU=paid), not a signup."
      />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/[0.08] bg-zinc-950/50 p-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-400">Free</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Keyless</h2>
            <p className="mt-2 text-sm text-zinc-500">MCK_SKU=free · no upstream API key</p>
            <ul className="mt-6 space-y-2 text-sm text-zinc-300">
              {FREE.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link
              href="/connect"
              className="mt-8 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Connect the demo
            </Link>
          </article>
          <article className="rounded-3xl border border-violet-400/20 bg-violet-500/[0.04] p-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Paid</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Trust tier</h2>
            <p className="mt-2 text-sm text-zinc-500">MCK_SKU=paid · self-host or the hosted gateway</p>
            <ul className="mt-6 space-y-2 text-sm text-zinc-300">
              {PAID.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <a
              href={`${GITHUB_REPO}/blob/main/docs/hosted-gateway.md`}
              className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-100 transition hover:border-white/30"
            >
              Self-host the paid SKU
            </a>
          </article>
        </div>
        <div className="mx-auto mt-8 max-w-6xl rounded-3xl border border-white/[0.08] px-8 py-6 text-sm leading-relaxed text-zinc-400">
          <p>
            There is no dollar price and no checkout here. The hosted gateway you see on{" "}
            <Link href="/status" className="text-zinc-200 underline-offset-4 hover:underline">status</Link> reports its
            SKU from <span className="font-mono text-zinc-200">/healthz</span>. To run paid yourself, set{" "}
            <span className="font-mono text-zinc-200">MCK_SKU=paid</span>,{" "}
            <span className="font-mono text-zinc-200">MCK_SOURCE_PROFILE=trust</span>, and the upstream keys. Issuing
            a bearer token is <span className="font-mono text-zinc-200">MCK_API_KEYS</span>.
          </p>
        </div>
      </section>
    </>
  );
}
