import { Injectable } from '@nestjs/common';

/**
 * Short-lived in-process cache of valid sessions, so the JWT guard does not
 * hit Postgres on every request. Entries are dropped on logout and password
 * changes; anything revoked elsewhere stays usable for at most `TTL_MS`.
 */
const TTL_MS = 30 * 1000;
const MAX_ENTRIES = 10_000;

type CachedSession = {
  userId: string;
  sessionExpiresAt: number;
  cachedUntil: number;
};

@Injectable()
export class SessionCacheService {
  private readonly sessions = new Map<string, CachedSession>();

  isValid(sessionId: string, userId: string): boolean {
    const entry = this.sessions.get(sessionId);
    if (!entry) return false;

    const now = Date.now();
    if (entry.cachedUntil <= now || entry.sessionExpiresAt <= now) {
      this.sessions.delete(sessionId);
      return false;
    }

    return entry.userId === userId;
  }

  remember(sessionId: string, userId: string, sessionExpiresAt: Date): void {
    if (this.sessions.size >= MAX_ENTRIES) this.pruneExpired();
    if (this.sessions.size >= MAX_ENTRIES) this.sessions.clear();

    this.sessions.set(sessionId, {
      userId,
      sessionExpiresAt: sessionExpiresAt.getTime(),
      cachedUntil: Date.now() + TTL_MS,
    });
  }

  forgetSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  forgetUser(userId: string): void {
    for (const [sessionId, entry] of this.sessions) {
      if (entry.userId === userId) this.sessions.delete(sessionId);
    }
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [sessionId, entry] of this.sessions) {
      if (entry.cachedUntil <= now) this.sessions.delete(sessionId);
    }
  }
}
