import type { Redis } from 'ioredis';

/**
 * Keyv store backed by the shared ioredis client. While Redis is not ready
 * every call is an instant miss/no-op, so an outage costs extra upstream
 * calls but never stalls a request.
 */
export class RedisCacheStore {
  /** Set by Keyv; keys it passes in are already prefixed with it. */
  namespace?: string;

  constructor(private readonly client: Redis) {}

  private get ready(): boolean {
    return this.client.status === 'ready';
  }

  async get(key: string): Promise<string | undefined> {
    if (!this.ready) return undefined;
    try {
      return (await this.client.get(key)) ?? undefined;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (!this.ready) return;
    try {
      if (ttl && ttl > 0) {
        await this.client.set(key, value, 'PX', ttl);
      } else {
        await this.client.set(key, value);
      }
    } catch {
      /* cache writes are best-effort */
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.ready) return false;
    try {
      return (await this.client.del(key)) > 0;
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    if (!this.ready || !this.namespace) return;
    const stream = this.client.scanStream({ match: `${this.namespace}:*` });
    for await (const keys of stream as AsyncIterable<string[]>) {
      if (keys.length > 0) await this.client.del(...keys);
    }
  }
}
