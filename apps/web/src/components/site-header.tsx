import Link from "next/link";

const links = [
  { href: "#architecture", label: "Architecture" },
  { href: "#sources", label: "Sources" },
  { href: "https://github.com/o-mid/mcp-connector-kit", label: "GitHub", external: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 text-sm font-medium tracking-tight text-zinc-100">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-xs font-bold text-zinc-950">
            M
          </span>
          mcp-connector-kit
        </Link>
        <nav className="flex items-center gap-5 text-sm text-zinc-400 sm:gap-6">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                className="transition hover:text-white"
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="transition hover:text-white">
                {l.label}
              </Link>
            ),
          )}
          <a
            href="https://mcp-connector-kit-production.up.railway.app/mcp"
            className="hidden rounded-full border border-white/15 px-3.5 py-1.5 text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.04] sm:inline-flex"
          >
            Live MCP
          </a>
        </nav>
      </div>
    </header>
  );
}
