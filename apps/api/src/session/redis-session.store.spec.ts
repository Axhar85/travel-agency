import type { SessionData } from 'express-session';
import { RedisSessionStore } from './redis-session.store';

const session = {
  cookie: { originalMaxAge: null },
  booking: { step: 'passengers' },
} as unknown as SessionData;

describe('RedisSessionStore', () => {
  function buildStore(ttlSeconds = 1800) {
    const store = new Map<string, string>();
    const redis = {
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      del: jest.fn(async (key: string) => {
        store.delete(key);
        return 1;
      }),
      expire: jest.fn(async () => 1),
    } as any;
    return { sessionStore: new RedisSessionStore(redis, ttlSeconds), redis };
  }

  it('set stores the session with the configured TTL, then get retrieves it', (done) => {
    const { sessionStore, redis } = buildStore(1800);

    sessionStore.set('sid-1', session, (err) => {
      expect(err).toBeUndefined();
      expect(redis.set).toHaveBeenCalledWith(
        'sess:sid-1',
        JSON.stringify(session),
        'EX',
        1800,
      );

      sessionStore.get('sid-1', (getErr, retrieved) => {
        expect(getErr).toBeNull();
        expect(retrieved).toEqual(session);
        done();
      });
    });
  });

  it('get returns null for an unknown session id', (done) => {
    const { sessionStore } = buildStore();

    sessionStore.get('missing', (err, retrieved) => {
      expect(err).toBeNull();
      expect(retrieved).toBeNull();
      done();
    });
  });

  it('destroy removes the session', (done) => {
    const { sessionStore, redis } = buildStore();

    sessionStore.set('sid-1', session, () => {
      sessionStore.destroy('sid-1', () => {
        expect(redis.del).toHaveBeenCalledWith('sess:sid-1');
        done();
      });
    });
  });

  it('touch refreshes the TTL', (done) => {
    const { sessionStore, redis } = buildStore(1800);

    sessionStore.touch('sid-1', session, (err) => {
      expect(err).toBeUndefined();
      expect(redis.expire).toHaveBeenCalledWith('sess:sid-1', 1800);
      done();
    });
  });

  it('propagates Redis errors to the callback instead of throwing', (done) => {
    const { sessionStore, redis } = buildStore();
    redis.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    sessionStore.get('sid-1', (err) => {
      expect(err).toBeInstanceOf(Error);
      done();
    });
  });

  // A logged-in customer session (AccountService.login/register) sets
  // session.cookie.maxAge far longer than the default booking-session TTL -
  // without deriving the Redis TTL from it, the record would still expire
  // in `defaultTtlSeconds` regardless of what the cookie itself promises.
  describe('per-session TTL derived from cookie.maxAge', () => {
    const longLivedSession = {
      cookie: { maxAge: 2_592_000_000 }, // 30 days, in ms
      userId: 'user-1',
    } as unknown as SessionData;

    it('set uses the TTL from session.cookie.maxAge when present, not the default', (done) => {
      const { sessionStore, redis } = buildStore(1800);

      sessionStore.set('sid-1', longLivedSession, () => {
        expect(redis.set).toHaveBeenCalledWith(
          'sess:sid-1',
          JSON.stringify(longLivedSession),
          'EX',
          2_592_000,
        );
        done();
      });
    });

    it('touch refreshes using the TTL from session.cookie.maxAge when present', (done) => {
      const { sessionStore, redis } = buildStore(1800);

      sessionStore.touch('sid-1', longLivedSession, () => {
        expect(redis.expire).toHaveBeenCalledWith('sess:sid-1', 2_592_000);
        done();
      });
    });

    it('falls back to the constructor default when cookie.maxAge is absent', (done) => {
      const { sessionStore, redis } = buildStore(1800);

      sessionStore.set('sid-1', session, () => {
        expect(redis.set).toHaveBeenCalledWith(
          'sess:sid-1',
          JSON.stringify(session),
          'EX',
          1800,
        );
        done();
      });
    });
  });
});
