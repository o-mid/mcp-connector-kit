import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { recordContract } from "./record.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

describe("mck record", () => {
  it("requires MCK_LIVE=1", async () => {
    const prev = process.env.MCK_LIVE;
    delete process.env.MCK_LIVE;
    await expect(
      recordContract({
        root,
        source: "fixture",
        tool: "echo",
        inputJson: '{"message":"x"}',
      }),
    ).rejects.toThrow(/MCK_LIVE=1/);
    if (prev !== undefined) process.env.MCK_LIVE = prev;
  });
});
