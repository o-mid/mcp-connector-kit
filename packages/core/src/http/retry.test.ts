import { describe, expect, it, vi } from "vitest";
import { backoffDelayMs, isRetryableStatus, withRetries } from "./retry.js";

describe("retry", () => {
  it("classifies retryable HTTP statuses", () => {
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
  });

  it("retries until success", async () => {
    let calls = 0;
    const result = await withRetries(async () => {
      calls += 1;
      if (calls < 3) throw new Error("fail");
      return "ok";
    });
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("backs off within cap", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const delay = backoffDelayMs(2, { maxAttempts: 3, baseDelayMs: 100, maxDelayMs: 500 });
    expect(delay).toBeLessThanOrEqual(500);
    vi.restoreAllMocks();
  });
});
