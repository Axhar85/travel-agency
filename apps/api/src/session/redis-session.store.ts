import { Store, SessionData } from 'express-session';
import type Redis from 'ioredis';

const SESSION_KEY_PREFIX = 'sess:';

/**
 * express-session's Store interface is small enough to implement directly
 * against the ioredis client already used everywhere else in this app
 * (connect-redis v9 only supports the `redis` package's client, not
 * ioredis — pulling in a second Redis client library just for sessions
 * isn't worth it for ~40 lines of code).
 */
export class RedisSessionStore extends Store {
  constructor(
    private readonly redis: Redis,
    private readonly ttlSeconds: number,
  ) {
    super();
  }

  get(
    sid: string,
    callback: (err: unknown, session?: SessionData | null) => void,
  ): void {
    this.redis
      .get(SESSION_KEY_PREFIX + sid)
      .then((data) =>
        callback(null, data ? (JSON.parse(data) as SessionData) : null),
      )
      .catch((err: unknown) => callback(err));
  }

  set(
    sid: string,
    session: SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    this.redis
      .set(
        SESSION_KEY_PREFIX + sid,
        JSON.stringify(session),
        'EX',
        this.ttlSeconds,
      )
      .then(() => callback?.())
      .catch((err: unknown) => callback?.(err));
  }

  destroy(sid: string, callback?: (err?: unknown) => void): void {
    this.redis
      .del(SESSION_KEY_PREFIX + sid)
      .then(() => callback?.())
      .catch((err: unknown) => callback?.(err));
  }

  touch(
    sid: string,
    _session: SessionData,
    callback?: (err?: unknown) => void,
  ): void {
    this.redis
      .expire(SESSION_KEY_PREFIX + sid, this.ttlSeconds)
      .then(() => callback?.())
      .catch((err: unknown) => callback?.(err));
  }
}
