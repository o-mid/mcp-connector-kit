import { z } from "zod";
import { describe, expect, it } from "vitest";
import { expectSchemaDrift, expectUpstreamValid, withFieldRemoved } from "./drift.js";

const EchoUpstream = z.object({ value: z.string() });

describe("drift helpers", () => {
  it("accepts valid upstream", () => {
    const data = expectUpstreamValid(EchoUpstream, { value: "x" }, {
      sourceId: "fixture",
      tool: "echo",
    });
    expect(data.value).toBe("x");
  });

  it("fails on mutated fixture", () => {
    const bad = withFieldRemoved({ value: "x" }, "value");
    expectSchemaDrift(EchoUpstream, bad, { sourceId: "fixture", tool: "echo" });
  });
});
