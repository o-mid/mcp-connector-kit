"use client";

import { motion } from "framer-motion";
import { HeroVisual } from "./hero-visual";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function Hero() {
  return (
    <section className="relative px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:pb-28 lg:pt-24">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
        <div>
          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium tracking-wide text-zinc-300"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Contract-tested MCP gateway
          </motion.p>
          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="max-w-xl text-4xl font-semibold tracking-[-0.03em] text-white sm:text-[2.75rem] sm:leading-[1.08]"
          >
            Connect agents to APIs{" "}
            <span className="text-zinc-500">without fragile one-offs.</span>
          </motion.h1>
          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400"
          >
            Shared limits, drift detection, and offline{" "}
            <code className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.85em] text-zinc-200">
              *.contract.json
            </code>{" "}
            replay—one gateway, many trust-tier sources.
          </motion.p>
          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-9 flex flex-wrap gap-3"
          >
            <a
              href="https://github.com/o-mid/mcp-connector-kit#quick-start"
              className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
            >
              Quick start
            </a>
            <a
              href="https://mcp-connector-kit-production.up.railway.app/healthz"
              className="inline-flex items-center rounded-full border border-white/15 px-5 py-2.5 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.04]"
            >
              Gateway health
            </a>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}
