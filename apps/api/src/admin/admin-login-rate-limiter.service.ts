import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';

const KEY_PREFIX = 'admin:login-attempts:';
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

/**
 * Cheap per-IP brute-force guard on POST /admin/login. Scoped small on
 * purpose (single-owner tool, no PII/payment data behind it), but a login
 * endpoint with zero rate limiting is still a real gap CLAUDE.md's
 * "security as first-class" applies to - and Redis is already there, so
 * this is a few lines, not a new dependency.
 */
@Injectable()
export class AdminLoginRateLimiter {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  /** Returns true if this IP may attempt another login right now. */
  async isAllowed(ip: string): Promise<boolean> {
    const attempts = await this.redis.get(KEY_PREFIX + ip);
    return !attempts || Number(attempts) < MAX_ATTEMPTS;
  }

  /** Call after a failed login attempt. */
  async recordFailure(ip: string): Promise<void> {
    const key = KEY_PREFIX + ip;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, WINDOW_SECONDS);
    }
  }

  /** Call after a successful login to let a legitimate admin retry immediately next time. */
  async reset(ip: string): Promise<void> {
    await this.redis.del(KEY_PREFIX + ip);
  }
}
