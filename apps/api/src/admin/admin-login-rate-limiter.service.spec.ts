import { AdminLoginRateLimiter } from './admin-login-rate-limiter.service';

function buildRedis() {
  const store = new Map<string, number>();
  const ttls = new Map<string, number>();
  return {
    get: jest.fn(async (key: string) => {
      const value = store.get(key);
      return value === undefined ? null : String(value);
    }),
    incr: jest.fn(async (key: string) => {
      const next = (store.get(key) ?? 0) + 1;
      store.set(key, next);
      return next;
    }),
    expire: jest.fn(async (key: string, seconds: number) => {
      ttls.set(key, seconds);
      return 1;
    }),
    del: jest.fn(async (key: string) => {
      store.delete(key);
      return 1;
    }),
  } as any;
}

describe('AdminLoginRateLimiter', () => {
  it('allows attempts under the limit', async () => {
    const redis = buildRedis();
    const limiter = new AdminLoginRateLimiter(redis);

    for (let i = 0; i < 4; i++) {
      expect(await limiter.isAllowed('1.2.3.4')).toBe(true);
      await limiter.recordFailure('1.2.3.4');
    }
  });

  it('blocks once the limit is reached', async () => {
    const redis = buildRedis();
    const limiter = new AdminLoginRateLimiter(redis);

    for (let i = 0; i < 5; i++) {
      await limiter.recordFailure('1.2.3.4');
    }

    expect(await limiter.isAllowed('1.2.3.4')).toBe(false);
  });

  it('sets a TTL only on the first failure', async () => {
    const redis = buildRedis();
    const limiter = new AdminLoginRateLimiter(redis);

    await limiter.recordFailure('1.2.3.4');
    await limiter.recordFailure('1.2.3.4');

    expect(redis.expire).toHaveBeenCalledTimes(1);
  });

  it('tracks each IP independently', async () => {
    const redis = buildRedis();
    const limiter = new AdminLoginRateLimiter(redis);

    for (let i = 0; i < 5; i++) {
      await limiter.recordFailure('1.2.3.4');
    }

    expect(await limiter.isAllowed('5.6.7.8')).toBe(true);
  });

  it('reset() clears the counter so a successful login does not linger', async () => {
    const redis = buildRedis();
    const limiter = new AdminLoginRateLimiter(redis);

    for (let i = 0; i < 5; i++) {
      await limiter.recordFailure('1.2.3.4');
    }
    await limiter.reset('1.2.3.4');

    expect(await limiter.isAllowed('1.2.3.4')).toBe(true);
  });
});
