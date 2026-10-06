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
  });
});
