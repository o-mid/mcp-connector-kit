import { describe, expect, it } from "vitest";
import { resolveSourceIds } from "./profiles.js";

describe("source profiles", () => {
  it("resolves research to wikipedia, openalex, and openlibrary", () => {
    expect(resolveSourceIds("research", "")).toEqual(["wikipedia", "openalex", "openlibrary"]);
  });

  it("resolves geo and daily toolkits", () => {
    expect(resolveSourceIds("geo", "")).toEqual(["open-meteo", "usgs", "worldbank"]);
    expect(resolveSourceIds("daily", "")).toEqual(["frankfurter", "hn", "open-meteo"]);
  });

  it("falls back to the explicit comma list when the profile is unknown", () => {
    expect(resolveSourceIds("nope", "fixture,wikipedia")).toEqual(["fixture", "wikipedia"]);
    expect(resolveSourceIds(undefined, "fixture")).toEqual(["fixture"]);
  });
});
