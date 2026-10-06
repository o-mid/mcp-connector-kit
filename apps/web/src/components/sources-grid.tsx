"use client";

import { motion } from "framer-motion";

import { SOURCES } from "@/lib/site";

const sources = SOURCES;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export function SourcesGrid() {
  return (
    <section id="sources" className="border-t border-white/[0.06] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          className="mb-12 max-w-2xl"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Trust tier</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">Seven sources, each contracted</h2>
          <p className="mt-4 text-lg text-zinc-400">
            Every tool has an input schema, an upstream schema, and a fixture CI replays. The catalog stays small so
            the contracts stay true.
          </p>
        </motion.div>
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-40px" }}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {sources.map((s) => (
            <motion.article
              key={s.name}
              variants={item}
              className="group rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-5 transition hover:border-white/15 hover:bg-zinc-900/40"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-white">{s.name}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                    s.tier === "free"
                      ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                      : "bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20"
                  }`}
                >
                  {s.tier}
                </span>
              </div>
              <p className="mt-3 font-mono text-xs leading-relaxed text-zinc-500 group-hover:text-zinc-400">{s.tools}</p>
              <p className="mt-2 text-xs text-zinc-600">{s.note}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
