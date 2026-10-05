import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDefaultCache, createSourceRegistry } from "@mck/core";
import { expectUpstreamValid } from "@mck/testing";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { loadFixture } from "@mck/testing";
import { fixtureSource } from "./source.js";

const dir = path.dirname(fileURLToPath(import.meta.url));

describe("fixture contracts", () => {
  it("replays echo fixture through registry", async () => {
    const doc = await loadFixture<{ upstream: unknown; output: { echoed: string } }>(
      path.join(dir, "../fixtures/echo.contract.json"),
    );
    const upstream = expectUpstreamValid(z.object({ value: z.string() }), doc.upstream, {
      sourceId: "fixture",
      tool: "echo",
    });
    const registry = createSourceRegistry([fixtureSource], { cache: createDefaultCache() });
    const res = await registry.callTool("fixture.echo", { message: upstream.value });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.data).toEqual(doc.output);
  });
});
