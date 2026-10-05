export type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

export type CacheGetOptions = {
  staleWhileRevalidateMs?: number;
};

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs: number): Promise<void>;
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
