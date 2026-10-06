import { describe, expect, it } from "vitest";
import {
  CATALOG_SOURCES,
  DEMO_PRESETS,
  FREE_TIER_SOURCE_IDS,
  PAID_ONLY_SOURCE_IDS,
  SOURCE_PROFILE_IDS,
  SOURCE_PROFILES,
  TRUST_TIER_SOURCE_IDS,
} from "./index.js";

describe("source catalog", () => {
  it("splits free and paid without overlap", () => {
    expect(FREE_TIER_SOURCE_IDS).toEqual([
      "fixture",
      "wikipedia",
      "open-meteo",
      "frankfurter",
      "openalex",
      "openlibrary",
      "hn",
      "usgs",
      "worldbank",
    ]);
    expect(PAID_ONLY_SOURCE_IDS).toEqual(["github", "brave", "exa", "tavily", "web-reader"]);
    expect(FREE_TIER_SOURCE_IDS.filter((id) => PAID_ONLY_SOURCE_IDS.includes(id))).toEqual([]);
    expect(TRUST_TIER_SOURCE_IDS).toEqual([...FREE_TIER_SOURCE_IDS, ...PAID_ONLY_SOURCE_IDS]);
  });

  it("keeps default and trust profiles aligned with tiers", () => {
    expect(SOURCE_PROFILES.default).toEqual([...FREE_TIER_SOURCE_IDS]);
    expect(SOURCE_PROFILES.trust).toEqual([...TRUST_TIER_SOURCE_IDS]);
    expect(Object.keys(SOURCE_PROFILES).sort()).toEqual(["daily", "default", "geo", "research", "trust"]);
    expect([...SOURCE_PROFILE_IDS].sort()).toEqual(Object.keys(SOURCE_PROFILES).sort());
  });

  it("resolves named toolkits to catalog ids", () => {
    expect(SOURCE_PROFILES.research).toEqual(["wikipedia", "openalex", "openlibrary"]);
    expect(SOURCE_PROFILES.geo).toEqual(["open-meteo", "usgs", "worldbank"]);
    expect(SOURCE_PROFILES.daily).toEqual(["frankfurter", "hn", "open-meteo"]);
    for (const ids of Object.values(SOURCE_PROFILES)) {
      for (const id of ids) {
        expect(CATALOG_SOURCES.some((s) => s.id === id)).toBe(true);
      }
    }
  });

  it("points each demo preset at a tool on that source", () => {
    expect(DEMO_PRESETS.length).toBeGreaterThan(0);
    for (const source of CATALOG_SOURCES) {
      if (!source.demo) continue;
      expect(source.tools.some((t) => t.name === source.demo?.tool)).toBe(true);
    }
  });
});
