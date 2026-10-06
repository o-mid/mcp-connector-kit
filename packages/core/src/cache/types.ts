export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type CacheGetOptions = {
  staleWhileRevalidateMs?: number;
};

export interface CacheStore {
  // Generic value type is intentional for typed cache callers.
  /* eslint-disable @typescript-eslint/no-unnecessary-type-parameters -- cache API */
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
  /* eslint-enable @typescript-eslint/no-unnecessary-type-parameters */
  delete(key: string): Promise<void>;
  close(): Promise<void>;
}

export function stableHashInput(input: unknown): string {
  return JSON.stringify(sortKeys(input));
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortKeys);
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = sortKeys(obj[k]);
  return out;
}
