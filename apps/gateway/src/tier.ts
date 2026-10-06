/** Hosted gateway SKU: which sources and limits apply. */
export type GatewaySku = "free" | "paid";

/** Keyless sources. Free SKU and the public demo load this list. */
export const FREE_TIER_SOURCES = [
  "fixture",
  "wikipedia",
  "open-meteo",
  "frankfurter",
  "openalex",
  "openlibrary",
  "hn",
  "usgs",
  "worldbank",
] as const;

export const SKU_SOURCE_ALLOWLIST: Record<GatewaySku, readonly string[]> = {
  free: FREE_TIER_SOURCES,
  paid: [...FREE_TIER_SOURCES, "github", "web-reader", "brave", "exa", "tavily"],
};

export const TRUST_TIER_SOURCES = [
  ...FREE_TIER_SOURCES,
  "github",
  "web-reader",
  "brave",
  "exa",
  "tavily",
] as const;

export function parseSku(value: string | undefined): GatewaySku {
  return value === "paid" ? "paid" : "free";
}

/** Drops sources not included in the active SKU. */
export function filterSourcesForSku(sourceIds: string[], sku: GatewaySku): string[] {
  const allowed = new Set<string>(SKU_SOURCE_ALLOWLIST[sku]);
  return sourceIds.filter((id) => allowed.has(id));
}

/** Scales rate limits for paid tier (2× burst headroom on hosted). */
export function limitMultiplierForSku(sku: GatewaySku): number {
  return sku === "paid" ? 2 : 1;
}
