import { ConfigService } from '@nestjs/config';
import { of, Subject, throwError } from 'rxjs';
import { GdsAuthError } from '../gds/errors/gds.errors';
import { TravelportAuthError } from './errors/travelport.errors';
import { TravelportAuthService } from './travelport-auth.service';

function buildConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    TRAVELPORT_CLIENT_ID: 'test-client-id',
    TRAVELPORT_CLIENT_SECRET: 'test-client-secret',
    TRAVELPORT_USERNAME: 'test-user',
    TRAVELPORT_PASSWORD: 'test-password',
    ...overrides,
  };
  return {
    get: (key: string, fallback?: string) => values[key] ?? fallback,
  } as unknown as ConfigService;
}

const tokenResponse = { data: { access_token: 'token-1', expires_in: 86_400 } };

describe('TravelportAuthService', () => {
  it('requests a token with the documented password grant and pre-production endpoint by default', async () => {
    const post = jest.fn().mockReturnValue(of(tokenResponse));
    const service = new TravelportAuthService({ post } as any, buildConfig());

    const token = await service.getAccessToken();

    expect(token).toBe('token-1');
    expect(post).toHaveBeenCalledTimes(1);
    const [url, body, options] = post.mock.calls[0];
    expect(url).toBe('https://auth.pp.travelport.net/oauth/token');
    const form = new URLSearchParams(body as string);
    expect(form.get('grant_type')).toBe('password');
    expect(form.get('username')).toBe('test-user');
    expect(form.get('password')).toBe('test-password');
    expect(form.get('client_id')).toBe('test-client-id');
    expect(form.get('client_secret')).toBe('test-client-secret');
    expect(options).toEqual(
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
  });

  it('uses the production endpoint only when TRAVELPORT_ENV=production', async () => {
    const post = jest.fn().mockReturnValue(of(tokenResponse));
    const service = new TravelportAuthService(
      { post } as any,
      buildConfig({ TRAVELPORT_ENV: 'production' }),
    );

    await service.getAccessToken();

    expect(post.mock.calls[0][0]).toBe(
      'https://auth.travelport.net/oauth/token',
    );
  });

  it('reuses the cached token instead of refetching (Travelport asks callers not to)', async () => {
    const post = jest.fn().mockReturnValue(of(tokenResponse));
    const service = new TravelportAuthService({ post } as any, buildConfig());

    await service.getAccessToken();
    await service.getAccessToken();

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('refetches once the cached token is within its safety margin of expiring', async () => {
    const post = jest
      .fn()
      .mockReturnValueOnce(
        of({ data: { access_token: 'short', expires_in: 60 } }),
      )
      .mockReturnValueOnce(of(tokenResponse));
    const service = new TravelportAuthService({ post } as any, buildConfig());

    // expires_in 60s is inside the 5 minute safety margin - already stale.
    expect(await service.getAccessToken()).toBe('short');
    expect(await service.getAccessToken()).toBe('token-1');
    expect(post).toHaveBeenCalledTimes(2);
  });

  it('falls back to the documented 24h lifetime when expires_in is missing', async () => {
    const post = jest
      .fn()
      .mockReturnValue(of({ data: { access_token: 'token-1' } }));
    const service = new TravelportAuthService({ post } as any, buildConfig());

    await service.getAccessToken();
    await service.getAccessToken();

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent requests into a single token fetch', async () => {
    const subject = new Subject<typeof tokenResponse>();
    const post = jest.fn().mockReturnValue(subject);
    const service = new TravelportAuthService({ post } as any, buildConfig());

    const first = service.getAccessToken();
    const second = service.getAccessToken();
    subject.next(tokenResponse);
    subject.complete();

    expect(await Promise.all([first, second])).toEqual(['token-1', 'token-1']);
    expect(post).toHaveBeenCalledTimes(1);
  });

  it.each([
    'TRAVELPORT_CLIENT_ID',
    'TRAVELPORT_CLIENT_SECRET',
    'TRAVELPORT_USERNAME',
    'TRAVELPORT_PASSWORD',
  ])(
    'throws TravelportAuthError without calling out when %s is missing',
    async (key) => {
      const post = jest.fn();
      const service = new TravelportAuthService(
        { post } as any,
        buildConfig({ [key]: '' }),
      );

      await expect(service.getAccessToken()).rejects.toThrow(
        TravelportAuthError,
      );
      expect(post).not.toHaveBeenCalled();
    },
  );

  it('wraps HTTP failures in a GdsAuthError that never carries the request (which holds the password)', async () => {
    const post = jest.fn().mockReturnValue(
      throwError(() => ({
        message: 'Request failed with status code 401',
        config: {
          data: 'password=test-password&client_secret=test-client-secret',
        },
        response: { data: { error: 'invalid_grant' } },
      })),
    );
    const service = new TravelportAuthService({ post } as any, buildConfig());

    const error = await service.getAccessToken().catch((e: unknown) => e);

    expect(error).toBeInstanceOf(TravelportAuthError);
    expect(error).toBeInstanceOf(GdsAuthError);
    expect(JSON.stringify(error)).not.toContain('test-password');
    expect(JSON.stringify(error)).not.toContain('test-client-secret');
    expect((error as TravelportAuthError).cause).toEqual({
      error: 'invalid_grant',
    });
  });
});
