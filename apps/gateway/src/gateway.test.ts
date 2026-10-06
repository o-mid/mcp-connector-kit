import { describe, expect, it } from "vitest";
import { createGatewayRegistry } from "./index.js";
import { loadConfig } from "./config.js";

describe("gateway", () => {
  it("loads fixture source", () => {
    const registry = createGatewayRegistry(
      loadConfig({ MCK_SOURCES: "fixture", LOG_LEVEL: "silent" }),
    );
    expect(registry.listToolNames()).toContain("fixture.echo");
  });

  it("parses the public demo flag", () => {
    expect(loadConfig({ MCK_PUBLIC_DEMO: "true", LOG_LEVEL: "silent" }).MCK_PUBLIC_DEMO).toBe(true);
    expect(loadConfig({ LOG_LEVEL: "silent" }).MCK_PUBLIC_DEMO).toBe(false);
  });

  it("expands default profile", () => {
    const registry = createGatewayRegistry(
      loadConfig({ MCK_SOURCE_PROFILE: "default", LOG_LEVEL: "silent" }),
    );
    expect(registry.listToolNames()).toContain("fixture.echo");
    expect(registry.listToolNames()).toContain("wikipedia.wiki_search");
    expect(registry.listToolNames()).toContain("openlibrary.book_search");
    expect(registry.listToolNames()).toContain("hn.hn_search");
    expect(registry.listToolNames()).toContain("usgs.recent_quakes");
    expect(registry.listToolNames()).toContain("worldbank.country_profile");
  });

  it("expands research profile", () => {
    const config = loadConfig({ MCK_SOURCE_PROFILE: "research", LOG_LEVEL: "silent" });
    expect(config.sourceIds).toEqual(["wikipedia", "openalex", "openlibrary"]);
  });
});
