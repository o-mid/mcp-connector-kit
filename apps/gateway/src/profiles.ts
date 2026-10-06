import { FREE_TIER_SOURCES, TRUST_TIER_SOURCES } from "./tier.js";

/** Named source bundles for demos and deployments. */
export const SOURCE_PROFILES: Record<string, string[]> = {
  default: [...FREE_TIER_SOURCES],
  trust: [...TRUST_TIER_SOURCES],
};

export function resolveSourceIds(profile: string | undefined, explicit: string): string[] {
  if (profile) {
    const ids = SOURCE_PROFILES[profile];
    if (ids) return ids;
  }
  return explicit
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
