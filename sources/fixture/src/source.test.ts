import { createDefaultCache, createSourceRegistry } from "@mck/core";
import { describe, expect, it } from "vitest";
import { fixtureSource } from "./source.js";

describe("fixture source", () => {
  const registry = createSourceRegistry([fixtureSource], { cache: createDefaultCache() });

  it("echoes input", async () => {
    const res = await registry.callTool("fixture.echo", { message: "hi" });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual({ echoed: "hi" });
  });

  it("simulates schema drift", async () => {
    const res = await registry.callTool("fixture.echo", {
      message: "x",
      simulate: "schema_drift",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("upstream_schema_changed");
  });
});
