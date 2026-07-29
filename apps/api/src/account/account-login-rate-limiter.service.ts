import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { RedisRateLimiter } from '../common/redis-rate-limiter.service';
import { REDIS_CLIENT } from '../redis/redis.constants';

const KEY_PREFIX = 'account:login-attempts:';
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 15 * 60;

/** Same per-IP brute-force guard as AdminLoginRateLimiter, applied to POST /account/login. */
@Injectable()
export class AccountLoginRateLimiter extends RedisRateLimiter {
  constructor(@Inject(REDIS_CLIENT) redis: Redis) {
    super(redis, KEY_PREFIX, MAX_ATTEMPTS, WINDOW_SECONDS);
  }
}
