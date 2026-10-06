"use client";

import { useMemo, useState } from "react";
import { CodeBlock } from "@/components/code-block";
import { DEMO_MCP_URL, MCP_URL } from "@/lib/site";
import { cursorInstallHref, cursorMcpJson, mcpServerConfig } from "@/lib/mcp-config";

export function SourceConnect({
  sourceId,
  title,
  tier,
}: {
  sourceId: string;
  title: string;
  tier: "free" | "paid";
}) {
  const [apiKey, setApiKey] = useState("");
  const isPaid = tier === "paid";
  const url = isPaid ? MCP_URL : DEMO_MCP_URL;
  const name = isPaid ? `mck-${sourceId}` : `mck-${sourceId}-demo`;
  const config = useMemo(() => mcpServerConfig(url, isPaid ? apiKey : ""), [url, isPaid, apiKey]);
  const snippet = useMemo(() => cursorMcpJson(name, config), [name, config]);
  const installHref = cursorInstallHref(name, config);

  return (
    <div className="space-y-4 rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-6">
      <p className="font-medium text-white">Add to Cursor</p>
      {isPaid ? (
        <>
          <p className="text-sm leading-relaxed text-zinc-400">
            Paid tools live on <span className="font-mono text-zinc-200">/mcp</span> and need a gateway API key.
            Paste one to fill the header; it stays in this tab.
          </p>
          <label className="block text-sm text-zinc-300">
            Gateway API key
            <input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
              }}
              placeholder="Paste a key to fill the header"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 font-mono text-sm text-white outline-none ring-violet-400/40 placeholder:text-zinc-600 focus:ring-2"
            />
          </label>
        </>
      ) : (
        <p className="text-sm leading-relaxed text-zinc-400">
          Free tools on this source run through{" "}
          <span className="font-mono text-zinc-200">{DEMO_MCP_URL}</span> when the gateway has{" "}
          <span className="font-mono text-zinc-200">MCK_PUBLIC_DEMO=true</span>. No bearer token.
        </p>
      )}
      <a
        href={installHref}
        className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
      >
        Add {title} to Cursor
      </a>
      {isPaid && apiKey.trim().length > 0 ? (
        <p className="text-xs text-amber-200/90">This install link contains the bearer token. Treat it like a secret.</p>
      ) : null}
      <CodeBlock label=".cursor/mcp.json" code={snippet} />
    </div>
  );
}
