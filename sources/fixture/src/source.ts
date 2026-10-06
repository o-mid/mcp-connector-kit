import { ConnectorError, defineSource, defineTool, validateUpstream } from "@mck/core";
import { z } from "zod";

const UpstreamEcho = z.object({ value: z.string() });
const EchoOut = z.object({ echoed: z.string() });

const echo = defineTool({
  name: "echo",
  description: "Returns the input for offline demos.",
  input: z.object({
    message: z.string(),
    simulate: z
      .enum(["rate_limit", "timeout", "schema_drift", "flaky"])
      .optional(),
  }),
  upstream: UpstreamEcho,
  output: EchoOut,
  run({ input, ctx }) {
    if (input.simulate === "rate_limit") {
      throw new ConnectorError("upstream_rate_limited", "Simulated 429", { source: "fixture" });
    }
    if (input.simulate === "timeout") {
      throw new ConnectorError("upstream_timeout", "Simulated timeout", { source: "fixture" });
    }
    if (input.simulate === "schema_drift") {
      validateUpstream(UpstreamEcho, { bad: true }, {
        sourceId: "fixture",
        tool: "echo",
        metrics: ctx.metrics,
      });
    }
    if (input.simulate === "flaky" && Math.random() < 0.5) {
      throw new ConnectorError("upstream_unavailable", "Simulated flake", { source: "fixture" });
    }
    const upstream = validateUpstream(UpstreamEcho, { value: input.message }, {
      sourceId: "fixture",
      tool: "echo",
      metrics: ctx.metrics,
    });
    return Promise.resolve({ echoed: upstream.data.value });
  },
});

const health = defineTool({
  name: "health",
  description: "Fixture source health probe.",
  input: z.object({}),
  upstream: z.object({ ok: z.boolean() }),
  output: z.object({ status: z.string() }),
  run() {
    return Promise.resolve({ status: "healthy" });
  },
});

export const fixtureSource = defineSource({
  id: "fixture",
  title: "Offline fixture source",
  baseUrls: ["https://fixture.local"],
  limits: { rps: 10, burst: 10, concurrency: 4, timeoutMs: 5000 },
  cache: { defaultTtlMs: 0 },
  tools: [echo, health],
});
