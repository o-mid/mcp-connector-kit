import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { ADDING_A_SOURCE, GITHUB_REPO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Add a source",
  description: "Scaffold a contracted MCP source. Open-Meteo is the suggested first addition.",
};

const STEPS = [
  {
    title: "Scaffold",
    body: "pnpm mck new source open-meteo writes sources/open-meteo with a contract-test stub.",
  },
  {
    title: "Define the tool",
    body: "defineSource sets baseUrls and limits. defineTool sets Zod input, upstream JSON, and output.",
  },
  {
    title: "Record a fixture",
    body: "Add sources/open-meteo/fixtures/*.contract.json and run pnpm mck check. CI replays it with the network blocked.",
  },
  {
    title: "Register it",
    body: "Add the id in apps/gateway/src/sources.ts. Trust-tier sources also go in the trust profile and the paid SKU allowlist.",
  },
];

export default function ContributePage() {
  return (
    <>
      <PageIntro
        kicker="Contributing"
        title="Add a source in an afternoon."
        lede="A source is a package with a schema, a fixture, and a slot in the gateway. Open-Meteo is the suggested first one: a public JSON forecast API, no key, useful to an agent, small enough to review."
      />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <ol className="grid gap-3 sm:grid-cols-2">
            {STEPS.map((step, i) => (
              <li key={step.title} className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5">
                <p className="font-mono text-xs text-zinc-500">0{i + 1}</p>
                <h2 className="mt-2 font-medium text-white">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={ADDING_A_SOURCE}
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Read the guide
            </a>
            <a
              href={`${GITHUB_REPO}/issues/new?title=Add%20Open-Meteo%20source&labels=good%20first%20issue&body=Scaffold%20sources/open-meteo%20with%20a%20contract%20fixture%20for%20the%20forecast%20API.%20No%20API%20key.%20Follow%20docs/adding-a-source.md.`}
              className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-100 transition hover:border-white/30"
            >
              Open a good-first issue
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
