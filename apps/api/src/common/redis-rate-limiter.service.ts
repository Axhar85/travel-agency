import type Redis from 'ioredis';

/**
 * Generic per-key brute-force guard (Redis INCR + EXPIRE), extracted once a
 * second real caller showed up (AdminLoginRateLimiter, then
 * AccountLoginRateLimiter) - not a speculative abstraction. Each caller
 * picks its own key prefix/limits and gets its own NestJS-injectable
 * subclass, matching the existing one-rate-limiter-per-endpoint convention
 * rather than a single shared provider parameterized at runtime.
 */
export class RedisRateLimiter {
  constructor(
    protected readonly redis: Redis,
    private readonly keyPrefix: string,
    private readonly maxAttempts: number,
    private readonly windowSeconds: number,
  ) {}

  /** Returns true if this key may attempt another login right now. */
  async isAllowed(key: string): Promise<boolean> {
    const attempts = await this.redis.get(this.keyPrefix + key);
    return !attempts || Number(attempts) < this.maxAttempts;
  }

  /** Call after a failed login attempt. */
  async recordFailure(key: string): Promise<void> {
    const redisKey = this.keyPrefix + key;
    const count = await this.redis.incr(redisKey);
    if (count === 1) {
      await this.redis.expire(redisKey, this.windowSeconds);
    }
  }

  /** Call after a successful login to let a legitimate user retry immediately next time. */
  async reset(key: string): Promise<void> {
    await this.redis.del(this.keyPrefix + key);
  }
}
