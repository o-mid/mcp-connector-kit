import Link from "next/link";
import { ArchitectureFlow } from "@/components/architecture-flow";
import { CodeBlock } from "@/components/code-block";
import { Hero } from "@/components/hero";
import { LiveDemo } from "@/components/live-demo";
import { SourcesGrid } from "@/components/sources-grid";
import { ADDING_A_SOURCE, GITHUB_REPO, INSTALL_COMMANDS, REGISTRY_METADATA } from "@/lib/site";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ArchitectureFlow />
      <SourcesGrid />

      <section id="install" className="border-t border-white/[0.06] px-4 py-24 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Install</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
              Clone, build, run the gateway
            </h2>
            <p className="mt-4 text-lg text-zinc-400">
              Node 22 and pnpm 9. The commands start fixture and Wikipedia on port 8080. Health is{" "}
              <span className="font-mono text-sm text-zinc-200">GET /healthz</span>.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-zinc-500">
              <span className="font-mono text-zinc-300">@mck/gateway</span>,{" "}
              <span className="font-mono text-zinc-300">@mck/core</span>,{" "}
              <span className="font-mono text-zinc-300">@mck/server</span>, and{" "}
              <span className="font-mono text-zinc-300">@mck/cli</span> are the publish names. They are not on the
              public npm registry yet, so this clone is the install that runs. Registry metadata for the hosted URL
              lives in{" "}
              <a href={REGISTRY_METADATA} className="text-zinc-300 underline-offset-4 hover:underline">
                registry/server.json
              </a>
              . Submitting it is <span className="font-mono">mcp-publisher</span> against the{" "}
              <a
                href="https://github.com/modelcontextprotocol/registry"
                className="text-zinc-300 underline-offset-4 hover:underline"
              >
                official MCP Registry
              </a>
              .
            </p>
          </div>
          <CodeBlock label="shell" code={INSTALL_COMMANDS} />
        </div>
      </section>

      <section id="demo" className="border-t border-white/[0.06] px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Demo</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
            wiki_search, live
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-zinc-400">
            The box calls the gateway&apos;s public demo when <span className="font-mono text-sm text-zinc-200">MCK_PUBLIC_DEMO=true</span>.
            Otherwise it asks English Wikipedia and returns the same{" "}
            <span className="font-mono text-sm text-zinc-200">{"{ query, results }"}</span> shape. Watch{" "}
            <Link href="/status" className="text-zinc-200 underline-offset-4 hover:underline">
              status
            </Link>{" "}
            for <span className="font-mono text-sm text-zinc-200">mck_tool_calls_total</span> after a gateway call.
          </p>
          <div className="mt-8">
            <LiveDemo />
          </div>
        </div>
      </section>

      <section className="border-t border-white/[0.06] px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Who it&apos;s for</p>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/[0.08] bg-zinc-950/40 p-8">
              <h2 className="text-xl font-semibold text-white">Connector author</h2>
              <p className="mt-3 text-zinc-400">
                You ship a tool the way you ship a small service: Zod schemas, a recorded contract, a place in the
                gateway, a metric when the upstream drifts.
              </p>
              <Link href="/contribute" className="mt-6 inline-flex text-sm text-zinc-200 underline-offset-4 hover:underline">
                Add a source
              </Link>
            </article>
            <article className="rounded-3xl border border-white/[0.08] bg-zinc-950/40 p-8">
              <h2 className="text-xl font-semibold text-white">Agent builder</h2>
              <p className="mt-3 text-zinc-400">
                You want one MCP URL. Free is Wikipedia. Paid adds Brave, Exa, or Tavily, plus fetch against an
                allowlist, with a rate limit and a contract behind each tool.
              </p>
              <Link href="/pricing" className="mt-6 inline-flex text-sm text-zinc-200 underline-offset-4 hover:underline">
                See the SKUs
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="px-4 pb-28 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/[0.08] bg-white/[0.02] px-8 py-14 sm:px-16">
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Open-Meteo is the next source</h2>
          <p className="mt-4 max-w-xl text-zinc-400">
            Public forecast JSON, no API key, one fixture. The guide is{" "}
            <span className="font-mono text-sm text-zinc-200">pnpm mck new source open-meteo</span>, then{" "}
            <span className="font-mono text-sm text-zinc-200">pnpm mck check</span>.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contribute"
              className="inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Contributing path
            </Link>
            <a
              href={ADDING_A_SOURCE}
              className="inline-flex rounded-full border border-white/15 px-6 py-2.5 text-sm text-zinc-200 transition hover:border-white/30"
            >
              docs/adding-a-source.md
            </a>
            <a
              href={GITHUB_REPO}
              className="inline-flex rounded-full border border-white/15 px-6 py-2.5 text-sm text-zinc-200 transition hover:border-white/30"
            >
              GitHub
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
