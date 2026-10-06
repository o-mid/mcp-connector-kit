"use client";

import { motion, useReducedMotion } from "framer-motion";

type Step = {
  id: string;
  title: string;
  subtitle: string;
};

const steps: Step[] = [
  { id: "client", title: "MCP client", subtitle: "Cursor · Claude · custom" },
  { id: "transport", title: "Transport", subtitle: "stdio or Streamable HTTP" },
  { id: "gateway", title: "@mck/gateway", subtitle: "SKU · auth · routing" },
  { id: "registry", title: "Registry", subtitle: "cache · validate · metrics" },
  { id: "source", title: "Source tool", subtitle: "Zod in / out" },
  { id: "upstream", title: "Upstream API", subtitle: "allowlisted HTTP" },
];

const features = [
  "Input validation (Zod)",
  "Token bucket + breaker",
  "Prometheus /metrics",
  "Free vs paid SKU filter",
];

export function ArchitectureFlow() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="architecture" className="border-t border-white/[0.06] px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-14 max-w-2xl"
        >
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">Architecture</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">
            One request path, end to end
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            The same pipeline runs in production and in CI contract replay—no mocks in prod, no surprises in deploy.
          </p>
        </motion.div>

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/60 p-6 sm:p-10 backdrop-blur-sm">
          <div className="hidden lg:block">
            <svg viewBox="0 0 960 120" className="w-full" aria-label="Architecture pipeline">
              <defs>
                <linearGradient id="flowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#71717a" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#fafafa" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#71717a" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <line x1="80" y1="60" x2="880" y2="60" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              {!reduceMotion && (
                <motion.line
                  x1="80"
                  y1="60"
                  x2="880"
                  y2="60"
                  stroke="url(#flowLine)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 14"
                  animate={{ strokeDashoffset: [0, -40] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                />
              )}
              {steps.map((step, i) => {
                const x = 80 + i * 160;
                return (
                  <motion.g
                    key={step.id}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07 }}
                  >
                    <circle cx={x} cy={60} r="22" fill="#18181b" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <text
                      x={x}
                      y={64}
                      textAnchor="middle"
                      fill="#fafafa"
                      fontSize="11"
                      fontWeight="600"
                      fontFamily="var(--font-geist-sans), sans-serif"
                    >
                      {i + 1}
                    </text>
                    <text
                      x={x}
                      y={98}
                      textAnchor="middle"
                      fill="#fafafa"
                      fontSize="12"
                      fontFamily="var(--font-geist-sans), sans-serif"
                    >
                      {step.title}
                    </text>
                    <text
                      x={x}
                      y={114}
                      textAnchor="middle"
                      fill="#71717a"
                      fontSize="10"
                      fontFamily="var(--font-geist-sans), sans-serif"
                    >
                      {step.subtitle}
                    </text>
                    {!reduceMotion && (
                      <motion.circle
                        cx={x}
                        cy={60}
                        r="4"
                        fill="#fafafa"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.35,
                          ease: "easeInOut",
                        }}
                      />
                    )}
                  </motion.g>
                );
              })}
            </svg>
          </div>

          <ol className="space-y-4 lg:hidden">
            {steps.map((step, i) => (
              <motion.li
                key={step.id}
                initial={{ opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 rounded-2xl border border-white/[0.06] bg-black/20 px-4 py-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-white ring-1 ring-white/10">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium text-white">{step.title}</p>
                  <p className="text-sm text-zinc-500">{step.subtitle}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          <ul className="mt-8 flex flex-wrap gap-2 border-t border-white/[0.06] pt-6 text-xs text-zinc-500 sm:gap-3 sm:text-sm">
            {features.map((f) => (
              <li
                key={f}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-zinc-400"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
