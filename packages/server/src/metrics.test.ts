import { describe, expect, it } from "vitest";
import { Registry } from "prom-client";
import { createPrometheusRecorder } from "./metrics.js";

describe("prometheus recorder", () => {
  it("records tool call counters", async () => {
    const registry = new Registry();
    const metrics = createPrometheusRecorder(registry);
    metrics.increment("mck_tool_calls_total", {
      source: "fixture",
      tool: "echo",
      outcome: "ok",
    });
    const body = await registry.metrics();
    expect(body).toContain("mck_tool_calls_total");
  });
});
