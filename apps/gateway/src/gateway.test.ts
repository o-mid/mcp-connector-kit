import { describe, expect, it } from "vitest";
import { createGatewayRegistry } from "./index.js";

describe("gateway", () => {
  it("loads fixture source", () => {
    const registry = createGatewayRegistry({
      MCK_SOURCES: "fixture",
      MCK_TRANSPORT: "stdio",
      MCK_LEGACY_TOOL_NAMES: false,
      MCK_LEGACY_ERRORS: false,
      MCK_CACHE: "memory",
      PORT: 8080,
      LOG_LEVEL: "info",
      sourceIds: ["fixture"],
      apiKeys: [],
      corsOrigins: [],
    });
    expect(registry.listToolNames()).toContain("fixture.echo");
  });
});
