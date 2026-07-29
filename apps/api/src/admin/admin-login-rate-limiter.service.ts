import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { RedisRateLimiter } from '../common/redis-rate-limiter.service';
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
export class AdminLoginRateLimiter extends RedisRateLimiter {
  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    super(redis, KEY_PREFIX, MAX_ATTEMPTS, WINDOW_SECONDS);
  }
}
