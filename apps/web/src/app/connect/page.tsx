import type { Metadata } from "next";
import Link from "next/link";
import { ConnectPanel } from "@/components/connect-panel";
import { PageIntro } from "@/components/page-intro";
import { PROFILE_EXAMPLES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Connect",
  description: "Cursor, Claude Desktop, and LangChain configs for the MCP Connector Kit gateway.",
};

export default function ConnectPage() {
  return (
    <>
      <PageIntro
        kicker="Connect"
        title="One URL, three clients."
        lede="Cursor gets a one-click install. Claude Desktop and LangChain get the same Streamable HTTP server, with the bearer token in a header when you use the full gateway."
      />
      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-10">
          <ConnectPanel />
          <div className="max-w-2xl rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-6 text-sm leading-relaxed text-zinc-400">
            <p className="font-medium text-white">Source profiles</p>
            <p className="mt-2">
              Self-host can load a named toolkit instead of listing ids.{" "}
              <span className="font-mono text-zinc-200">MCK_SOURCE_PROFILE=research</span> is Wikipedia, OpenAlex, and
              Open Library. See the <Link href="/sources" className="text-zinc-200 underline-offset-4 hover:underline">sources page</Link>{" "}
              for geo and daily.
            </p>
            <ul className="mt-3 space-y-1 font-mono text-xs text-zinc-500">
              {PROFILE_EXAMPLES.map((p) => (
                <li key={p.name}>{p.env}</li>
              ))}
            </ul>
          </div>
          <div className="max-w-2xl rounded-3xl border border-white/[0.08] bg-white/[0.02] px-6 py-6 text-sm leading-relaxed text-zinc-400">
            <p className="font-medium text-white">Credentials</p>
            <p className="mt-2">
              The client credential is a gateway API key, or a JWT if you point{" "}
              <span className="font-mono text-zinc-200">MCK_OAUTH_JWKS_URL</span> at your own identity provider.
              This site does not run an OAuth consent screen for Slack, Notion, or GitHub. That broker is a Composio
              job — see the <Link href="/compare" className="text-zinc-200 underline-offset-4 hover:underline">compare page</Link>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
