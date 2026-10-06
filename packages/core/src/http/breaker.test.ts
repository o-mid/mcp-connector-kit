import { describe, expect, it } from "vitest";
import { CircuitBreaker } from "./breaker.js";

describe("CircuitBreaker", () => {
  it("opens after consecutive failures", () => {
    let now = 0;
    const breaker = new CircuitBreaker(
      { failureThreshold: 2, resetTimeoutMs: 1000 },
      () => now,
    );
    breaker.onFailure();
    breaker.beforeCall();
    breaker.onFailure();
    expect(breaker.state).toBe("open");
    expect(() => { breaker.beforeCall(); }).toThrow("breaker_open");
    now = 2000;
    breaker.beforeCall();
    expect(breaker.state).toBe("half_open");
  });
});
