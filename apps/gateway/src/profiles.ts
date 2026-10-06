/** Named source bundles for demos and deployments. */
export const SOURCE_PROFILES: Record<string, string[]> = {
  default: ["fixture", "wikipedia"],
  trust: ["fixture", "wikipedia", "github", "web-reader", "brave", "exa", "tavily"],
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
