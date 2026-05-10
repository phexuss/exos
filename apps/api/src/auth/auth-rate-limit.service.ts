import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  message?: string;
};

@Injectable()
export class AuthRateLimitService {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private cleanupCounter = 0;

  consume({ key, limit, windowMs, message }: RateLimitOptions): void {
    const now = Date.now();
    const current = this.buckets.get(key);
    const bucket =
      current && current.resetAt > now
        ? current
        : { count: 0, resetAt: now + windowMs };

    if (bucket.count >= limit) {
      throw new HttpException(
        message ?? 'Too many requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);
    this.cleanupExpiredBuckets(now);
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  private cleanupExpiredBuckets(now: number): void {
    this.cleanupCounter += 1;
    if (this.cleanupCounter % 100 !== 0) return;

    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}
