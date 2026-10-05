export type BreakerState = "closed" | "open" | "half_open";

export type BreakerConfig = {
  failureThreshold: number;
  resetTimeoutMs: number;
};

/**
 * Opens after consecutive failures so a dead upstream does not absorb retries.
 */
export class CircuitBreaker {
  state: BreakerState = "closed";
  consecutiveFailures = 0;
  private openedAt: number | null = null;

  constructor(
    private readonly config: BreakerConfig,
    private readonly now: () => number = () => Date.now(),
  ) {}

  beforeCall(): void {
    if (this.state === "open") {
      const opened = this.openedAt ?? 0;
      if (this.now() - opened >= this.config.resetTimeoutMs) {
        this.state = "half_open";
      } else {
        throw new Error("breaker_open");
      }
    }
  }

  onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
    this.openedAt = null;
  }

  onFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.config.failureThreshold) {
      this.state = "open";
      this.openedAt = this.now();
    }
  }
}
