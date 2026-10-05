import { describe, expect, it, vi } from "vitest";
import { ConcurrencySemaphore, TokenBucket } from "./limiter.js";

describe("TokenBucket", () => {
  it("refills tokens over time", async () => {
    let now = 0;
    const bucket = new TokenBucket({ rps: 2, burst: 2 }, () => now);
    await bucket.acquire();
    await bucket.acquire();
    now = 1000;
    await bucket.acquire();
    expect(now).toBe(1000);
  });
});

describe("ConcurrencySemaphore", () => {
  it("limits parallel work", async () => {
    const sem = new ConcurrencySemaphore(1);
    let active = 0;
    let max = 0;
    const task = async () => {
      await sem.run(async () => {
        active += 1;
        max = Math.max(max, active);
        await new Promise((r) => setTimeout(r, 20));
        active -= 1;
      });
    };
    await Promise.all([task(), task()]);
    expect(max).toBe(1);
  });
});
