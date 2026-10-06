"use client";

import { motion, useReducedMotion } from "framer-motion";

const satellites = [
  { label: "Wiki", angle: 0 },
  { label: "Weather", angle: 60 },
  { label: "Rates", angle: 120 },
  { label: "Papers", angle: 180 },
  { label: "Books", angle: 240 },
  { label: "Quakes", angle: 300 },
];

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative aspect-[4/3] w-full max-w-lg mx-auto lg:max-w-none">
      <div className="absolute inset-0 rounded-3xl border border-white/[0.08] bg-zinc-950/80 shadow-2xl shadow-black/40 backdrop-blur-sm">
        <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,transparent_45%)]" />
        <svg viewBox="0 0 400 300" className="h-full w-full p-6" aria-hidden>
          <defs>
            <linearGradient id="hubGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
            <filter id="softGlow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {satellites.map((s, i) => {
            const rad = (s.angle * Math.PI) / 180;
            const cx = 200 + Math.cos(rad) * 118;
            const cy = 150 + Math.sin(rad) * 88;
            return (
              <g key={s.label}>
                <motion.line
                  x1="200"
                  y1="150"
                  x2={cx}
                  y2={cy}
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="1"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.08, duration: 0.8 }}
                />
                <motion.circle
                  r="3"
                  fill="#fafafa"
                  filter="url(#softGlow)"
                  initial={{ cx: 200, cy: 150 }}
                  animate={
                    reduceMotion
                      ? { cx, cy }
                      : { cx: [200, cx, cx], cy: [150, cy, cy] }
                  }
                  transition={{
                    duration: 2.2,
                    repeat: reduceMotion ? 0 : Infinity,
                    repeatDelay: 1.5,
                    delay: i * 0.35,
                    ease: "easeInOut",
                  }}
                />
                <motion.g
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.06 }}
                >
                  <rect
                    x={cx - 40}
                    y={cy - 14}
                    width="80"
                    height="28"
                    rx="8"
                    fill="rgba(24,24,27,0.9)"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <text
                    x={cx}
                    y={cy + 4}
                    textAnchor="middle"
                    fill="#a1a1aa"
                    fontSize="10"
                    fontFamily="var(--font-geist-mono), monospace"
                  >
                    {s.label}
                  </text>
                </motion.g>
              </g>
            );
          })}
          <motion.g
            animate={reduceMotion ? undefined : { scale: [1, 1.03, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "200px 150px" }}
          >
            <polygon
              points="200,118 232,134 232,166 200,182 168,166 168,134"
              fill="url(#hubGrad)"
              opacity="0.95"
            />
            <text
              x="200"
              y="154"
              textAnchor="middle"
              fill="#09090b"
              fontSize="11"
              fontWeight="600"
              fontFamily="var(--font-geist-mono), monospace"
            >
              gateway
            </text>
          </motion.g>
        </svg>
        <motion.div
          className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/[0.06] bg-black/40 px-3 py-2 font-mono text-[11px] text-zinc-400"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <span className="text-emerald-400/90">●</span> POST /demo/mcp · keyless tools
        </motion.div>
      </div>
    </div>
  );
}
