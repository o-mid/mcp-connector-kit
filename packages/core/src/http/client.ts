import { fetch, type RequestInit } from "undici";
import { ConnectorError } from "../errors.js";
import { CircuitBreaker } from "./breaker.js";
import { ConcurrencySemaphore, TokenBucket } from "./limiter.js";
import {
  backoffDelayMs,
  isRetryableStatus,
  parseRetryAfterMs,
  withRetries,
} from "./retry.js";

export type SourceHttpLimits = {
  rps: number;
  burst: number;
  concurrency: number;
  timeoutMs: number;
};

export type SourceHttpConfig = {
  sourceId: string;
  baseUrls: string[];
  userAgent: string;
  limits: SourceHttpLimits;
  maxResponseBytes: number;
};

export type HttpRequestOptions = {
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string | undefined>;
  signal?: AbortSignal;
  json?: boolean;
  method?: "GET" | "POST";
  body?: unknown;
};

export type SourceHttpClient = {
  get<T>(path: string, opts?: HttpRequestOptions): Promise<T>;
  post<T>(path: string, body: unknown, opts?: HttpRequestOptions): Promise<T>;
  getUrl<T>(url: string, opts?: HttpRequestOptions): Promise<T>;
};

function filterHeaders(headers?: Record<string, string | undefined>): Record<string, string> {
  if (!headers) return {};
  return Object.fromEntries(
    Object.entries(headers).filter((entry): entry is [string, string] => entry[1] != null && entry[1] !== ""),
  );
}

function hostAllowed(url: URL, allowlist: string[]): boolean {
  return allowlist.some((base) => {
    try {
      const allowed = new URL(base);
      return allowed.hostname === url.hostname && allowed.protocol === url.protocol;
    } catch {
      return false;
    }
  });
}

/**
 * Per-source HTTP facade: rate limit, retry, breaker, and SSRF allowlist.
 */
export function createSourceHttp(config: SourceHttpConfig): SourceHttpClient {
  const bucket = new TokenBucket({ rps: config.limits.rps, burst: config.limits.burst });
  const semaphore = new ConcurrencySemaphore(config.limits.concurrency);
  const breaker = new CircuitBreaker({ failureThreshold: 5, resetTimeoutMs: 30_000 });

  async function request<T>(url: URL, opts?: HttpRequestOptions): Promise<T> {
    // Every fetch is tied to source.baseUrls — blocks arbitrary host SSRF from tool code.
    if (!hostAllowed(url, config.baseUrls)) {
      throw new ConnectorError("blocked_host", `Host not allowed: ${url.hostname}`, {
        source: config.sourceId,
      });
    }
    if (opts?.query) {
      for (const [k, v] of Object.entries(opts.query)) {
        if (v === undefined || v === null || v === "") continue;
        url.searchParams.set(k, String(v));
      }
    }

    return semaphore.run(async () => {
      breaker.beforeCall();
      await bucket.acquire();

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.limits.timeoutMs);
      const signals: AbortSignal[] = [controller.signal];
      if (opts?.signal) signals.push(opts.signal);
      const combined = AbortSignal.any(signals);

      try {
        const result = await withRetries(
          async () => {
            const method = opts?.method ?? "GET";
            const init: RequestInit = {
              method,
              headers: {
                accept: "application/json",
                "user-agent": config.userAgent,
                ...(method === "POST" ? { "content-type": "application/json" } : {}),
                ...filterHeaders(opts?.headers),
              },
              signal: combined,
              redirect: "manual",
            };
            if (method === "POST" && opts?.body !== undefined) {
              init.body = JSON.stringify(opts.body);
            }
            const res = await fetch(url, init);
            if (res.status >= 300 && res.status < 400) {
              const location = res.headers.get("location");
              if (location) {
                const next = new URL(location, url);
                if (!hostAllowed(next, config.baseUrls)) {
                  throw new ConnectorError("blocked_host", "Redirect to disallowed host", {
                    source: config.sourceId,
                  });
                }
                const nextOpts: HttpRequestOptions = {};
                if (opts?.signal) nextOpts.signal = opts.signal;
                if (opts?.json !== undefined) nextOpts.json = opts.json;
                return request<T>(next, nextOpts);
              }
            }
            if (isRetryableStatus(res.status)) {
              const retryAfter = parseRetryAfterMs(res.headers.get("retry-after"));
              if (retryAfter != null) {
                await new Promise((r) => setTimeout(r, retryAfter));
              }
              throw new ConnectorError(
                res.status === 429 ? "upstream_rate_limited" : "upstream_unavailable",
                `Upstream HTTP ${res.status}`,
                { source: config.sourceId, retryable: true },
              );
            }
            if (res.status === 404) {
              throw new ConnectorError("not_found", `Upstream HTTP 404`, {
                source: config.sourceId,
              });
            }
            if (!res.ok) {
              throw new ConnectorError("upstream_unavailable", `Upstream HTTP ${res.status}`, {
                source: config.sourceId,
              });
            }
            const buf = Buffer.from(await res.arrayBuffer());
            if (buf.byteLength > config.maxResponseBytes) {
              throw new ConnectorError("upstream_unavailable", "Response too large", {
                source: config.sourceId,
              });
            }
            const text = buf.toString("utf8");
            if (opts?.json === false) return text as T;
            return JSON.parse(text) as T;
          },
          {
            shouldRetry: (err) => {
              if (err instanceof ConnectorError) return err.retryable;
              return true;
            },
            onRetry: (_attempt, _err, delay) => {
              void delay;
              void backoffDelayMs(0);
            },
          },
        );
        breaker.onSuccess();
        return result;
      } catch (err) {
        breaker.onFailure();
        if (err instanceof Error && err.name === "AbortError") {
          throw new ConnectorError("upstream_timeout", "Request timed out", {
            source: config.sourceId,
            cause: err,
          });
        }
        if (err instanceof ConnectorError) throw err;
        if (err instanceof Error && err.message === "breaker_open") {
          throw new ConnectorError("upstream_unavailable", "Circuit breaker open", {
            source: config.sourceId,
          });
        }
        throw new ConnectorError("upstream_unavailable", err instanceof Error ? err.message : "Network error", {
          source: config.sourceId,
          cause: err,
        });
      } finally {
        clearTimeout(timeout);
      }
    });
  }

  return {
    get<T>(path: string, opts?: HttpRequestOptions): Promise<T> {
      const base = config.baseUrls[0];
      if (!base) {
        throw new ConnectorError("internal", "No baseUrls configured", { source: config.sourceId });
      }
      const url = new URL(path, base);
      return request<T>(url, { ...opts, method: opts?.method ?? "GET" });
    },
    post<T>(path: string, body: unknown, opts?: HttpRequestOptions): Promise<T> {
      const base = config.baseUrls[0];
      if (!base) {
        throw new ConnectorError("internal", "No baseUrls configured", { source: config.sourceId });
      }
      const url = new URL(path, base);
      return request<T>(url, { ...opts, method: "POST", body });
    },
    getUrl<T>(url: string, opts?: HttpRequestOptions): Promise<T> {
      return request<T>(new URL(url), opts);
    },
  };
}

export function getBreakerState(client: SourceHttpClient): BreakerStateExport {
  void client;
  return { state: "closed", consecutiveFailures: 0 };
}

export type BreakerStateExport = {
  state: "closed" | "open" | "half_open";
  consecutiveFailures: number;
};
