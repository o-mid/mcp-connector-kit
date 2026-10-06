import Link from "next/link";

const links = [
  { href: "/connect", label: "Connect" },
  { href: "/sources", label: "Sources" },
  { href: "/compare", label: "Compare", wide: true },
  { href: "/pricing", label: "Pricing", wide: true },
  { href: "/status", label: "Status" },
  { href: "https://github.com/o-mid/mcp-connector-kit", label: "GitHub", external: true, wide: true },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-zinc-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 text-sm font-medium tracking-tight text-zinc-100">
          <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-zinc-950">
            M
          </span>
          <span className="truncate">mcp-connector-kit</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm text-zinc-400 sm:gap-5">
          {links.map((l) =>
            l.external ? (
              <a
                key={l.href}
                href={l.href}
                className={`transition hover:text-white ${l.wide ? "hidden sm:inline" : ""}`}
                target="_blank"
                rel="noreferrer"
              >
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} className={`transition hover:text-white ${l.wide ? "hidden sm:inline" : ""}`}>
                {l.label}
              </Link>
            ),
          )}
          <Link
            href="/connect"
            className="hidden rounded-full border border-white/15 px-3 py-1.5 text-zinc-200 transition hover:border-white/30 hover:bg-white/[0.04] sm:inline-flex"
          >
            Add to Cursor
          </Link>
        </nav>
      </div>
    </header>
  );
}
