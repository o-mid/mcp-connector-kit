"use client";

import { useState } from "react";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40">
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-zinc-500">{label ?? "snippet"}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-white/25 hover:text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed text-zinc-200">
        <code>{code}</code>
      </pre>
    </div>
  );
}
