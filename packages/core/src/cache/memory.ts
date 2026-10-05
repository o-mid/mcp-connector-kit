import type { CacheStore } from "./types.js";

type LruNode<T> = {
  key: string;
  entry: { value: T; expiresAt: number };
  prev: LruNode<T> | null;
  next: LruNode<T> | null;
};

/**
 * In-process LRU cache used when Redis is not configured.
 */
export class MemoryCache implements CacheStore {
  private readonly map = new Map<string, LruNode<unknown>>();
  private head: LruNode<unknown> | null = null;
  private tail: LruNode<unknown> | null = null;

  constructor(
    private readonly maxEntries: number,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const node = this.map.get(key);
    if (!node) return null;
    if (this.now() > node.entry.expiresAt) {
      this.removeNode(node);
      this.map.delete(key);
      return null;
    }
    this.touch(node);
    return node.entry.value as T;
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    const expiresAt = this.now() + ttlMs;
    const existing = this.map.get(key);
    if (existing) {
      existing.entry = { value, expiresAt };
      this.touch(existing);
      return;
    }
    const node: LruNode<unknown> = { key, entry: { value, expiresAt }, prev: null, next: null };
    this.map.set(key, node);
    this.pushFront(node);
    while (this.map.size > this.maxEntries) {
      const victim = this.tail;
      if (!victim) break;
      this.removeNode(victim);
      this.map.delete(victim.key);
    }
  }

  async delete(key: string): Promise<void> {
    const node = this.map.get(key);
    if (!node) return;
    this.removeNode(node);
    this.map.delete(key);
  }

  async close(): Promise<void> {
    this.map.clear();
    this.head = null;
    this.tail = null;
  }

  private touch(node: LruNode<unknown>): void {
    this.removeNode(node);
    this.pushFront(node);
  }

  private pushFront(node: LruNode<unknown>): void {
    node.prev = null;
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private removeNode(node: LruNode<unknown>): void {
    if (node.prev) node.prev.next = node.next;
    else this.head = node.next;
    if (node.next) node.next.prev = node.prev;
    else this.tail = node.prev;
    node.prev = null;
    node.next = null;
  }
}

const inflight = new Map<string, Promise<unknown>>();

/**
 * Coalesce identical cache keys so one upstream fetch serves many callers.
 */
export async function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const promise = fn().finally(() => {
    inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}
