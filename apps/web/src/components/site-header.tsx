import Link from "next/link";

const links = [
  { href: "#architecture", label: "Architecture" },
  { href: "#sources", label: "Sources" },
  { href: "https://github.com/o-mid/mcp-connector-kit", label: "GitHub", external: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070b14]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-mono text-sm font-medium tracking-tight">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30">
            M
          </span>
          mcp-connector-kit
        </Link>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          {links.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} className="hover:text-cyan-300 transition-colors" target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className="hover:text-cyan-300 transition-colors">
                {l.label}
              </Link>
            ),
          )}
          <a
            href="https://mcp-connector-kit-production.up.railway.app/mcp"
            className="hidden sm:inline-flex rounded-full bg-cyan-400/10 px-3 py-1.5 text-cyan-200 ring-1 ring-cyan-400/25 hover:bg-cyan-400/20 transition"
          >
            Live gateway
          </a>
        </nav>
      </div>
    </header>
  );
}
