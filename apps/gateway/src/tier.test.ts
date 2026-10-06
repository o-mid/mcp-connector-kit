import { describe, expect, it } from "vitest";
import { filterSourcesForSku } from "./tier.js";

describe("gateway SKU", () => {
  it("free tier keeps keyless sources and drops paid connectors", () => {
    expect(
      filterSourcesForSku(
        ["fixture", "wikipedia", "open-meteo", "frankfurter", "openalex", "openlibrary", "hn", "usgs", "worldbank", "github"],
        "free",
      ),
    ).toEqual([
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
  });

  it("paid tier includes trust sources", () => {
    const ids = filterSourcesForSku(
      ["fixture", "wikipedia", "github", "web-reader", "brave", "exa", "tavily"],
      "paid",
    );
    expect(ids).toContain("github");
    expect(ids).toContain("brave");
    expect(ids).toContain("exa");
    expect(ids).toContain("tavily");
  });
});
