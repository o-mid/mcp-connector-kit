import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { COMPOSIO_ROWS, SMITHERY_ROWS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Compare",
  description: "When to use MCP Connector Kit, a single MCP repo, Composio, or Smithery.",
};

export default function ComparePage() {
  return (
    <>
      <PageIntro
        kicker="Compare"
        title="Pick the tool that matches the job."
        lede="Composio is the short path to someone else's OAuth catalog. Smithery is where you find a server. MCK is where you keep a connector: schema, fixture, gateway, metrics."
      />
      <section className="px-4 pb-8 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-14">
          <div>
            <h2 className="text-xl font-semibold text-white">Against a single MCP repo</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-white/[0.03] text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium"> </th>
                    <th className="px-4 py-3 font-medium">One repository, one API</th>
                    <th className="px-4 py-3 font-medium">MCP Connector Kit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                  <Row a="Process" b="A server you wrote for that vendor" c="One gateway, many @mck/source-* packages" />
                  <Row a="HTTP policy" b="Copied per project" c="Shared limiter, breaker, cache, allowlist" />
                  <Row a="Upstream changes" b="You notice in production" c="*.contract.json replay in CI, drift counter on /metrics" />
                  <Row a="Client setup" b="A new command in mcp.json" c="One Streamable HTTP URL" />
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Against Composio</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08]">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/[0.03] text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Situation</th>
                    <th className="px-4 py-3 font-medium">Choose Composio</th>
                    <th className="px-4 py-3 font-medium">Choose MCK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {COMPOSIO_ROWS.map((row) => (
                    <tr key={row.situation}>
                      <td className="px-4 py-3 text-zinc-200">{row.situation}</td>
                      <td className="px-4 py-3 text-zinc-400">{row.composio}</td>
                      <td className="px-4 py-3 text-zinc-300">{row.mck}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white">Against Smithery</h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-white/[0.08]">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-white/[0.03] text-zinc-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Smithery</th>
                    <th className="px-4 py-3 font-medium">MCK</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {SMITHERY_ROWS.map((row) => (
                    <tr key={row.smithery}>
                      <td className="px-4 py-3 text-zinc-400">{row.smithery}</td>
                      <td className="px-4 py-3 text-zinc-200">{row.mck}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="max-w-2xl pb-16 text-sm leading-relaxed text-zinc-500">
            Seven contracted sources is the catalog on purpose. A directory of unmaintained scrapers is a different
            product. <Link href="/pricing" className="text-zinc-300 underline-offset-4 hover:underline">Pricing</Link>{" "}
            is the free Wikipedia SKU and the paid trust tier, both already in the gateway.
          </p>
        </div>
      </section>
    </>
  );
}

function Row({ a, b, c }: { a: string; b: string; c: string }) {
  return (
    <tr>
      <td className="px-4 py-3 text-zinc-200">{a}</td>
      <td className="px-4 py-3 text-zinc-400">{b}</td>
      <td className="px-4 py-3 text-zinc-300">{c}</td>
    </tr>
  );
}
