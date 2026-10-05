export type RetryConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

const DEFAULT_RETRY: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 800,
  maxDelayMs: 8000,
};

export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/** Full-jitter backoff so thundering herds do not align on retry. */
export function backoffDelayMs(attempt: number, config: RetryConfig = DEFAULT_RETRY): number {
  const cap = Math.min(config.maxDelayMs, config.baseDelayMs * 2 ** attempt);
  return Math.floor(Math.random() * cap);
}

export function parseRetryAfterMs(header: string | null): number | null {
  if (!header) return null;
  const seconds = Number(header);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(header);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return null;
}

export async function withRetries<T>(
  fn: (attempt: number) => Promise<T>,
  opts?: {
    config?: RetryConfig;
    shouldRetry?: (err: unknown, attempt: number) => boolean;
    onRetry?: (attempt: number, err: unknown, delayMs: number) => void;
  },
): Promise<T> {
  const config = opts?.config ?? DEFAULT_RETRY;
  let lastErr: unknown;
  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      const retry =
        attempt < config.maxAttempts - 1 &&
        (opts?.shouldRetry?.(err, attempt) ?? true);
      if (!retry) break;
      const delayMs = backoffDelayMs(attempt, config);
      opts?.onRetry?.(attempt, err, delayMs);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}
