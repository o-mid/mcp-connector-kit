/** Named source bundles for demos and regional packs. */
export const SOURCE_PROFILES: Record<string, string[]> = {
  "global-demo": ["fixture", "wikipedia"],
  "commerce-ir": ["torob", "khanoumi", "woocommerce"],
  cosmetic: ["cosmetic"],
};

export function resolveSourceIds(profile: string | undefined, explicit: string): string[] {
  if (profile && profile in SOURCE_PROFILES) {
    return SOURCE_PROFILES[profile]!;
  }
  return explicit
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
