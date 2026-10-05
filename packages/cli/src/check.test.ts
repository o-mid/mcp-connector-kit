import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { checkFixtureContracts } from "@mck/testing";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("mck check", () => {
  it("validates fixture contracts in repo", async () => {
    const results = await checkFixtureContracts(repoRoot);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.ok)).toBe(true);
  });
});
