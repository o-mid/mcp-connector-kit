/** Hosted gateway SKU: which sources and limits apply. */
export type GatewaySku = "free" | "paid";

export const SKU_SOURCE_ALLOWLIST: Record<GatewaySku, readonly string[]> = {
  free: ["fixture", "wikipedia"],
  paid: ["fixture", "wikipedia", "github", "web-reader", "brave", "exa"],
};

export const TRUST_TIER_SOURCES = [
  "fixture",
  "wikipedia",
  "github",
  "web-reader",
  "brave",
  "exa",
] as const;

export function parseSku(value: string | undefined): GatewaySku {
  return value === "paid" ? "paid" : "free";
}

/** Drops sources not included in the active SKU (free tier is Wikipedia + fixture only). */
export function filterSourcesForSku(sourceIds: string[], sku: GatewaySku): string[] {
  const allowed = new Set<string>(SKU_SOURCE_ALLOWLIST[sku]);
  return sourceIds.filter((id) => allowed.has(id));
}

/** Scales rate limits for paid tier (2× burst headroom on hosted). */
export function limitMultiplierForSku(sku: GatewaySku): number {
  return sku === "paid" ? 2 : 1;
}
