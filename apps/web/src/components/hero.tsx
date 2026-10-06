"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-xs font-medium text-cyan-200"
          >
            Contract-tested · read-only MCP
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="text-4xl font-semibold tracking-tight text-white sm:text-5xl sm:leading-[1.1]"
          >
            One gateway.
            <span className="block text-slate-400">Many trust-tier connectors.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400"
          >
            Ship MCP tools with shared rate limits, schema drift detection, and offline{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-sm text-cyan-200">*.contract.json</code>{" "}
            replay—not one-off adapters per API.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="https://github.com/o-mid/mcp-connector-kit#quick-start"
              className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-300 transition"
            >
              Quick start
            </a>
            <a
              href="https://mcp-connector-kit-production.up.railway.app/healthz"
              className="rounded-lg border border-white/10 px-5 py-2.5 text-sm text-slate-200 hover:border-cyan-400/30 hover:text-white transition"
            >
              Production health
            </a>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative glow-ring overflow-hidden rounded-2xl border border-white/10 bg-surface"
        >
          <Image
            src="/images/hero.png"
            alt="Abstract MCP connector hub illustration"
            width={1200}
            height={675}
            className="h-auto w-full object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-transparent to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
