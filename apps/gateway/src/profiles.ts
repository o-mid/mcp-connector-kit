import { SOURCE_PROFILES } from "@mck/catalog";

/** Named source bundles for demos and deployments. */
export { SOURCE_PROFILES };

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
