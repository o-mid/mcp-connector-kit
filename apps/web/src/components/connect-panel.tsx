"use client";

import { useMemo, useState, type ReactNode } from "react";
import { CodeBlock } from "@/components/code-block";
import { DEMO_MCP_URL, MCP_URL } from "@/lib/site";
import {
  claudeDesktopJson,
  cursorInstallHref,
  cursorMcpJson,
  langchainPython,
  mcpServerConfig,
} from "@/lib/mcp-config";

type Target = "demo" | "full";
type Client = "cursor" | "claude" | "langchain";

const CLIENTS: { id: Client; label: string }[] = [
  { id: "cursor", label: "Cursor" },
  { id: "claude", label: "Claude Desktop" },
  { id: "langchain", label: "LangChain" },
];

export function ConnectPanel() {
  const [target, setTarget] = useState<Target>("demo");
  const [client, setClient] = useState<Client>("cursor");
  const [apiKey, setApiKey] = useState("");

  const serverName = target === "demo" ? "mck-wikipedia" : "mck";
  const url = target === "demo" ? DEMO_MCP_URL : MCP_URL;
  const config = useMemo(() => mcpServerConfig(url, target === "full" ? apiKey : ""), [url, target, apiKey]);
  const snippet = useMemo(() => {
    if (client === "claude") return claudeDesktopJson(serverName, config);
    if (client === "langchain") return langchainPython(serverName, config);
    return cursorMcpJson(serverName, config);
  }, [client, serverName, config]);
  const installHref = cursorInstallHref(serverName, config);
  const keyInLink = target === "full" && apiKey.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Toggle
          pressed={target === "demo"}
          onClick={() => {
            setTarget("demo");
          }}
        >
          Free demo
        </Toggle>
        <Toggle
          pressed={target === "full"}
          onClick={() => {
            setTarget("full");
          }}
        >
          Full gateway
        </Toggle>
      </div>

      {target === "demo" ? (
        <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
          <span className="font-mono text-zinc-200">{DEMO_MCP_URL}</span> serves the free SKU (Wikipedia, weather,
          rates, papers, books, Hacker News, earthquakes, country profiles, fixture) with no bearer token, when the
          gateway is started with{" "}
          <span className="font-mono text-zinc-200">MCK_PUBLIC_DEMO=true</span>. Paid search and fetch stay on{" "}
          <span className="font-mono text-zinc-200">/mcp</span>.
        </p>
      ) : (
        <div className="max-w-2xl space-y-3">
          <p className="text-sm leading-relaxed text-zinc-400">
            The hosted <span className="font-mono text-zinc-200">/mcp</span> endpoint checks{" "}
            <span className="font-mono text-zinc-200">Authorization: Bearer</span> against{" "}
            <span className="font-mono text-zinc-200">MCK_API_KEYS</span>. Upstream keys for Brave, Exa, Tavily, and
            GitHub stay in the gateway environment. The agent never receives them.
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
          <p className="text-xs leading-relaxed text-zinc-500">
            The key stays in this browser tab. It is written into the snippet and, if you use the Cursor button, into
            that install link. There is no account form on this site: an operator issues keys.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CLIENTS.map((c) => (
          <Toggle
            key={c.id}
            pressed={client === c.id}
            onClick={() => {
              setClient(c.id);
            }}
          >
            {c.label}
          </Toggle>
        ))}
      </div>

      {client === "cursor" ? (
        <a
          href={installHref}
          className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-950 transition hover:bg-zinc-200"
        >
          Add to Cursor
        </a>
      ) : null}
      {keyInLink && client === "cursor" ? (
        <p className="text-xs text-amber-200/90">This install link contains the bearer token. Treat it like a secret.</p>
      ) : null}

      <CodeBlock
        label={
          client === "cursor"
            ? ".cursor/mcp.json"
            : client === "claude"
              ? "claude_desktop_config.json"
              : "langchain-mcp-adapters"
        }
        code={snippet}
      />

      {client === "claude" ? (
        <p className="max-w-2xl text-sm text-zinc-500">
          Claude Desktop reads this from its MCP config. Restart the app after saving. The shape is the remote
          Streamable HTTP server: <span className="font-mono">url</span> plus optional{" "}
          <span className="font-mono">headers</span>.
        </p>
      ) : null}
      {client === "langchain" ? (
        <p className="max-w-2xl text-sm text-zinc-500">
          Python client from <span className="font-mono">langchain-mcp-adapters</span>.{" "}
          <span className="font-mono">transport</span> is <span className="font-mono">streamable_http</span>, the same
          protocol the gateway speaks on <span className="font-mono">POST /mcp</span>.
        </p>
      ) : null}
    </div>
  );
}

function Toggle({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`rounded-full px-3.5 py-1.5 text-sm transition ${
        pressed
          ? "bg-white text-zinc-950"
          : "border border-white/10 text-zinc-300 hover:border-white/25 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
