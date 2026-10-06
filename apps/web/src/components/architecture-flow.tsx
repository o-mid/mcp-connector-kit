"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const nodes = [
  { id: "agent", label: "MCP client", x: 40, y: 120 },
  { id: "transport", label: "stdio / HTTP", x: 200, y: 80 },
  { id: "gateway", label: "@mck/gateway", x: 360, y: 120 },
  { id: "registry", label: "Source registry", x: 520, y: 80 },
  { id: "core", label: "@mck/core", x: 680, y: 120 },
  { id: "upstream", label: "Upstream APIs", x: 840, y: 80 },
];

const edges: [string, string][] = [
  ["agent", "transport"],
  ["transport", "gateway"],
  ["gateway", "registry"],
  ["registry", "core"],
  ["core", "upstream"],
];

function nodeById(id: string) {
  const n = nodes.find((node) => node.id === id);
  if (!n) throw new Error(`unknown node ${id}`);
  return n;
}

export function ArchitectureFlow() {
  return (
    <section id="architecture" className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight text-white">Animated request path</h2>
          <p className="mt-3 text-slate-400">
            From Cursor or Claude Desktop through Streamable HTTP to validated upstream JSON—same pipeline in CI
            fixtures.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface p-4 sm:p-6">
            <svg viewBox="0 0 920 200" className="h-auto w-full" aria-label="MCP connector architecture flow">
              <defs>
                <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#34d399" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              {edges.map(([a, b], i) => {
                const n1 = nodeById(a);
                const n2 = nodeById(b);
                const path = `M ${n1.x + 50} ${n1.y + 20} C ${(n1.x + n2.x) / 2} ${n1.y - 20}, ${(n1.x + n2.x) / 2} ${n2.y + 40}, ${n2.x} ${n2.y + 20}`;
                return (
                  <g key={`${a}-${b}`}>
                    <path d={path} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="2" />
                    <motion.path
                      d={path}
                      fill="none"
                      stroke="url(#edgeGrad)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeDasharray="8 12"
                      initial={{ strokeDashoffset: 0 }}
                      animate={{ strokeDashoffset: -40 }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
                    />
                    <motion.circle
                      r="4"
                      fill="#34d399"
                      initial={{ offsetDistance: "0%" }}
                      animate={{ offsetDistance: "100%" }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
                    >
                      <animateMotion dur="2.4s" repeatCount="indefinite" path={path} begin={`${i * 0.2}s`} />
                    </motion.circle>
                  </g>
                );
              })}
              {nodes.map((n, i) => (
                <motion.g
                  key={n.id}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <rect
                    x={n.x}
                    y={n.y}
                    width={100}
                    height={40}
                    rx="8"
                    fill="#131c30"
                    stroke="rgba(34,211,238,0.35)"
                    strokeWidth="1"
                  />
                  <text x={n.x + 50} y={n.y + 25} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontFamily="monospace">
                    {n.label}
                  </text>
                </motion.g>
              ))}
            </svg>
            <ul className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
              <li>Input Zod → cache → HTTP → output Zod</li>
              <li>Breaker + rate limit per source</li>
              <li>Prometheus at /metrics</li>
              <li>SKU filters free vs paid tools</li>
            </ul>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 glow-ring">
            <Image
              src="/images/architecture.png"
              alt="Isometric gateway to APIs diagram"
              width={1024}
              height={1024}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
