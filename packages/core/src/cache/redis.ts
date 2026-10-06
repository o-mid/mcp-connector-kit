import { Redis } from "ioredis";
import type { CacheStore } from "./types.js";

/** Redis-backed cache for multi-instance gateway deployments. */
export class RedisCache implements CacheStore {
  private readonly client: Redis;

  constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, { maxRetriesPerRequest: 2 });
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { value: T; expiresAt: number };
      if (Date.now() > parsed.expiresAt) {
        await this.client.del(key);
        return null;
      }
      return parsed.value;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlMs: number): Promise<void> {
    const payload = JSON.stringify({ value, expiresAt: Date.now() + ttlMs });
    await this.client.set(key, payload, "PX", ttlMs);
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}
