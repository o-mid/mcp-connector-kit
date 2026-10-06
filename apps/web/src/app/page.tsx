import { ArchitectureFlow } from "@/components/architecture-flow";
import { Hero } from "@/components/hero";
import { SourcesGrid } from "@/components/sources-grid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ArchitectureFlow />
      <SourcesGrid />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-semibold text-white">Add a source in one afternoon</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            <code className="text-cyan-200">pnpm mck new source myapi</code> — define tools, record fixtures, wire the
            gateway catalog.
          </p>
          <a
            href="https://github.com/o-mid/mcp-connector-kit/blob/main/docs/adding-a-source.md"
            className="mt-6 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Read the guide
          </a>
        </div>
      </section>
    </>
  );
}
