import { describe, expect, it } from "vitest";
import { MemoryCache, singleFlight } from "./memory.js";

describe("MemoryCache", () => {
  it("expires entries", async () => {
    let now = 1000;
    const cache = new MemoryCache(10, () => now);
    await cache.set("k", "v", 100);
    expect(await cache.get("k")).toBe("v");
    now = 1200;
    expect(await cache.get("k")).toBeNull();
  });

  it("single-flight dedupes concurrent calls", async () => {
    let calls = 0;
    const [a, b] = await Promise.all([
      singleFlight("x", async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 30));
        return 1;
      }),
      singleFlight("x", () => {
        calls += 1;
        return Promise.resolve(2);
      }),
    ]);
    expect(calls).toBe(1);
    expect(a).toBe(b);
  });
});
