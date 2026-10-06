import Link from "next/link";

const links = [
  { href: "/#architecture", label: "Architecture" },
  { href: "/#sources", label: "Sources" },
  { href: "/connect", label: "Connect" },
  { href: "/compare", label: "Compare" },
  { href: "/pricing", label: "Pricing" },
  { href: "/status", label: "Status" },
  { href: "/contribute", label: "Add a source" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.06] py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-sm text-zinc-500 sm:px-6">
        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-zinc-400 transition hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>
        <p>
          MIT ·{" "}
          <a
            href="https://github.com/o-mid/mcp-connector-kit"
            className="text-zinc-300 underline-offset-4 hover:text-white hover:underline"
          >
            o-mid/mcp-connector-kit
          </a>
        </p>
      </div>
    </footer>
  );
}
