import type { SourceDefinition } from "@mck/core";
import { fixtureSource } from "@mck/source-fixture";
import { wikipediaSource } from "@mck/source-wikipedia";

const catalog: Record<string, () => SourceDefinition> = {
  fixture: () => fixtureSource,
  wikipedia: () => wikipediaSource,
};

/** Resolves enabled source ids into concrete source definitions. */
export function resolveSources(ids: string[]): SourceDefinition[] {
  const out: SourceDefinition[] = [];
  for (const id of ids) {
    const factory = catalog[id];
    if (!factory) throw new Error(`Unknown source id: ${id}`);
    out.push(factory());
  }
  return out;
}
