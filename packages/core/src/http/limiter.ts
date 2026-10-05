export type RateLimitConfig = {
  rps: number;
  burst: number;
};

/**
 * Token bucket keyed by host so parallel tools share one upstream budget.
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly config: RateLimitConfig,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.tokens = config.burst;
    this.lastRefill = this.now();
  }

  /** Resolves when a token is available; uses fractional refill from elapsed time. */
  async acquire(): Promise<void> {
    for (;;) {
      this.refill();
      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }
      const msPerToken = 1000 / this.config.rps;
      const wait = Math.max(1, Math.ceil(msPerToken));
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  private refill(): void {
    const t = this.now();
    const elapsed = (t - this.lastRefill) / 1000;
    if (elapsed <= 0) return;
    this.tokens = Math.min(this.config.burst, this.tokens + elapsed * this.config.rps);
    this.lastRefill = t;
  }
}

/**
 * Limits concurrent in-flight upstream calls per source.
 */
export class ConcurrencySemaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];

  constructor(private readonly max: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.enter();
    try {
      return await fn();
    } finally {
      this.leave();
    }
  }

  private async enter(): Promise<void> {
    if (this.active < this.max) {
      this.active += 1;
      return;
    }
    await new Promise<void>((resolve) => {
      this.queue.push(resolve);
    });
    this.active += 1;
  }

  private leave(): void {
    this.active -= 1;
    const next = this.queue.shift();
    if (next) next();
  }
}
