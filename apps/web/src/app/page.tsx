"use client";

import { motion } from "framer-motion";
import { ArchitectureFlow } from "@/components/architecture-flow";
import { Hero } from "@/components/hero";
import { SourcesGrid } from "@/components/sources-grid";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ArchitectureFlow />
      <SourcesGrid />
      <section className="px-4 pb-28 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-6xl rounded-3xl border border-white/[0.08] bg-white/[0.02] px-8 py-14 text-center sm:px-16"
        >
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Add a source in one afternoon</h2>
          <p className="mx-auto mt-4 max-w-lg text-zinc-400">
            <code className="font-mono text-sm text-zinc-200">pnpm mck new source myapi</code>
            <span className="mt-2 block">Define tools, record fixtures, wire the gateway catalog.</span>
          </p>
          <a
            href="https://github.com/o-mid/mcp-connector-kit/blob/main/docs/adding-a-source.md"
            className="mt-8 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
          >
            Read the guide
          </a>
        </motion.div>
      </section>
    </>
  );
}
