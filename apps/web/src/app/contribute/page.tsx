import type { Metadata } from "next";
import { PageIntro } from "@/components/page-intro";
import { ADDING_A_SOURCE, GITHUB_REPO } from "@/lib/site";

export const metadata: Metadata = {
  title: "Add a source",
  description: "Scaffold a contracted MCP source. Next candidates: Wikidata, arXiv, Nominatim.",
};

const STEPS = [
  {
    title: "Scaffold",
    body: "pnpm mck new source myapi writes sources/myapi with a contract-test stub.",
  },
  {
    title: "Define the tool",
    body: "defineSource sets baseUrls and limits. defineTool sets Zod input, upstream JSON, and output.",
  },
  {
    title: "Record a fixture",
    body: "Add sources/myapi/fixtures/*.contract.json and run pnpm mck check. CI replays it with the network blocked.",
  },
  {
    title: "Register it",
    body: "Wire the id in apps/gateway/src/sources.ts, packages/catalog/src/data.json (free vs paid), registry/sources/<id>.json, then pnpm catalog:generate and pnpm validate:registry.",
  },
];

const NEXT = [
  { name: "Wikidata", why: "Entity search and lookup, no key, global identifiers agents already know." },
  { name: "arXiv", why: "Paper search for research workflows; pairs with OpenAlex." },
  { name: "Nominatim", why: "Geocoding that complements Open-Meteo and USGS." },
];

export default function ContributePage() {
  return (
    <>
      <PageIntro
        kicker="Contributing"
        title="Add a source in an afternoon."
        lede="A source is a package with a schema, a fixture, and a slot in the gateway. Open-Meteo already ships. Next useful additions are Wikidata, arXiv, and Nominatim: public JSON, no key, small enough to review."
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
          <div className="mt-10">
            <h2 className="text-xl font-semibold text-white">What to add next</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-3">
              {NEXT.map((item) => (
                <li key={item.name} className="rounded-2xl border border-white/[0.08] bg-zinc-950/40 p-5">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{item.why}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={ADDING_A_SOURCE}
              className="inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Read the guide
            </a>
            <a
              href={`${GITHUB_REPO}/issues`}
              className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-100 transition hover:border-white/30"
            >
              Open issues
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
