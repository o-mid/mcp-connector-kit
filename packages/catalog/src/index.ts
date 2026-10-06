import raw from "./data.json" with { type: "json" };
import type { CatalogDemo, CatalogFile, CatalogSource } from "./types.js";

export type {
  CatalogDemo,
  CatalogFile,
  CatalogSource,
  CatalogTier,
  CatalogTool,
  DemoField,
} from "./types.js";

const data = raw as CatalogFile;

export const CATALOG_SOURCES: readonly CatalogSource[] = data.sources;

export const FREE_TIER_SOURCE_IDS = CATALOG_SOURCES.filter((s) => s.tier === "free").map((s) => s.id);

export const PAID_ONLY_SOURCE_IDS = CATALOG_SOURCES.filter((s) => s.tier === "paid").map((s) => s.id);

export const TRUST_TIER_SOURCE_IDS = CATALOG_SOURCES.map((s) => s.id);

export const SOURCE_PROFILES: Record<string, string[]> = {
  default: [...FREE_TIER_SOURCE_IDS],
  trust: [...TRUST_TIER_SOURCE_IDS],
  ...data.profiles,
};

export const SOURCE_PROFILE_IDS = ["default", "trust", "research", "geo", "daily"] as const;

export type SourceProfileId = (typeof SOURCE_PROFILE_IDS)[number];

export const DEMO_PRESETS: CatalogDemo[] = CATALOG_SOURCES.flatMap((s) => (s.demo ? [s.demo] : []));

export const DEMO_TOOL_NAMES = DEMO_PRESETS.map((p) => p.tool);

export function getCatalogSource(id: string): CatalogSource | undefined {
  return CATALOG_SOURCES.find((s) => s.id === id);
}

export function isSourceProfile(value: string): boolean {
  return value in SOURCE_PROFILES;
}
