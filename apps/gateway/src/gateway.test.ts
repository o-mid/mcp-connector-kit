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

  it("expands global-demo profile", () => {
    const registry = createGatewayRegistry(
      loadConfig({ MCK_SOURCE_PROFILE: "global-demo", LOG_LEVEL: "silent" }),
    );
    expect(registry.listToolNames()).toContain("fixture.echo");
    expect(registry.listToolNames()).toContain("wikipedia.wiki_search");
  });
});
