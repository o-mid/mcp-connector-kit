import type { SourceDefinition } from "@mck/core";
import { fixtureSource } from "@mck/source-fixture";
import { khanoumiSource } from "@mck/source-khanoumi";
import { torobSource } from "@mck/source-torob";
import { createWooCommerceSource, DEFAULT_WOO_SHOPS, type WooShop } from "@mck/source-woocommerce";
import { wikipediaSource } from "@mck/source-wikipedia";
import { createCosmeticCompositeSource } from "./cosmetic.js";

const catalog: Record<string, (opts: { wooShops?: WooShop[] }) => SourceDefinition> = {
  fixture: () => fixtureSource,
  wikipedia: () => wikipediaSource,
  torob: () => torobSource,
  khanoumi: () => khanoumiSource,
  woocommerce: (opts) => createWooCommerceSource(opts.wooShops ?? DEFAULT_WOO_SHOPS),
  cosmetic: () => createCosmeticCompositeSource(),
};

/** Resolves enabled source ids into concrete source definitions. */
export function resolveSources(ids: string[], opts: { wooShops?: WooShop[] | undefined } = {}): SourceDefinition[] {
  const out: SourceDefinition[] = [];
  for (const id of ids) {
    const factory = catalog[id];
    if (!factory) throw new Error(`Unknown source id: ${id}`);
    out.push(factory(opts));
  }
  return out;
}
