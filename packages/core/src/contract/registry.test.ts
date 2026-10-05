import { describe, expect, it } from "vitest";
import { z } from "zod";
import { defineSource, defineTool } from "./define.js";
import { createDefaultCache, createSourceRegistry } from "./registry.js";

const demoSource = defineSource({
  id: "demo",
  title: "Demo",
  baseUrls: ["https://example.com"],
  limits: { rps: 2, burst: 2, concurrency: 2, timeoutMs: 5000 },
  cache: { defaultTtlMs: 0 },
  tools: [
    defineTool({
      name: "ping",
      description: "ping",
      input: z.object({}),
      upstream: z.object({ ok: z.boolean() }),
      output: z.object({ ok: z.boolean() }),
      async run() {
        return { ok: true };
      },
    }),
  ],
});

describe("source registry", () => {
  it("registers per-source health tools", () => {
    const registry = createSourceRegistry([demoSource], { cache: createDefaultCache() });
    expect(registry.listToolNames()).toContain("demo.health");
  });
});
