import type { SourceDefinition } from "@mck/core";
import { fixtureSource } from "@mck/source-fixture";
import { githubSource } from "@mck/source-github";
import { braveSource } from "@mck/source-brave";
import { exaSource } from "@mck/source-exa";
import { wikipediaSource } from "@mck/source-wikipedia";
import { createWebReaderSource } from "@mck/source-web-reader";

const catalog: Record<string, (opts: { webReaderAllowlist?: string[] }) => SourceDefinition> = {
  fixture: () => fixtureSource,
  wikipedia: () => wikipediaSource,
  github: () => githubSource,
  brave: () => braveSource,
  exa: () => exaSource,
  "web-reader": (opts) =>
    createWebReaderSource(
      opts.webReaderAllowlist ??
        process.env.MCK_WEB_READER_ALLOWLIST?.split(",").map((s) => s.trim()).filter(Boolean),
    ),
};

/** Resolves enabled source ids into concrete source definitions. */
export function resolveSources(
  ids: string[],
  opts: { webReaderAllowlist?: string[] } = {},
): SourceDefinition[] {
  const out: SourceDefinition[] = [];
  for (const id of ids) {
    const factory = catalog[id];
    if (!factory) throw new Error(`Unknown source id: ${id}`);
    out.push(factory(opts));
  }
  return out;
}
