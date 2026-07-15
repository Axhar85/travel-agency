import { ConfigService } from '@nestjs/config';
import { of, Subject, throwError } from 'rxjs';
import { AmadeusAuthError } from '../errors/amadeus.errors';
import { AmadeusAuthService } from './amadeus-auth.service';

function buildConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    AMADEUS_CLIENT_ID: 'test-client-id',
    AMADEUS_CLIENT_SECRET: 'test-client-secret',
    AMADEUS_API_BASE_URL: 'https://test.api.amadeus.com',
    ...overrides,
  };
  return {
    get: (key: string) => values[key],
    getOrThrow: (key: string) => {
      if (!values[key]) throw new Error(`Missing config: ${key}`);
      return values[key];
    },
  } as unknown as ConfigService;
}

describe('AmadeusAuthService', () => {
  it('fetches and caches an access token', async () => {
    const post = jest.fn().mockReturnValue(
      of({
        data: {
          access_token: 'token-1',
          expires_in: 1800,
          token_type: 'Bearer',
        },
      }),
    );
    const httpService = { post } as any;
    const service = new AmadeusAuthService(httpService, buildConfig());

    const token = await service.getAccessToken();

    expect(token).toBe('token-1');
    expect(post).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledWith(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      expect.stringContaining('grant_type=client_credentials'),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
  });

  it('reuses the cached token instead of refetching before expiry', async () => {
    const post = jest.fn().mockReturnValue(
      of({
        data: {
          access_token: 'token-1',
          expires_in: 1800,
          token_type: 'Bearer',
        },
      }),
    );
    const httpService = { post } as any;
    const service = new AmadeusAuthService(httpService, buildConfig());

    await service.getAccessToken();
    await service.getAccessToken();

    expect(post).toHaveBeenCalledTimes(1);
  });

  it('coalesces concurrent requests into a single token fetch', async () => {
    const subject = new Subject<{
      data: { access_token: string; expires_in: number; token_type: string };
    }>();
    const httpService = { post: jest.fn().mockReturnValue(subject) } as any;
    const service = new AmadeusAuthService(httpService, buildConfig());

    const first = service.getAccessToken();
    const second = service.getAccessToken();

    subject.next({
      data: { access_token: 'token-1', expires_in: 1800, token_type: 'Bearer' },
    });
    subject.complete();

    const [tokenA, tokenB] = await Promise.all([first, second]);

    expect(tokenA).toBe('token-1');
    expect(tokenB).toBe('token-1');
    expect(httpService.post).toHaveBeenCalledTimes(1);
  });

  it('throws AmadeusAuthError when credentials are missing', async () => {
    const service = new AmadeusAuthService(
      { post: jest.fn() } as any,
      buildConfig({ AMADEUS_CLIENT_ID: '' }),
    );

    await expect(service.getAccessToken()).rejects.toThrow(AmadeusAuthError);
  });

  it('wraps HTTP failures in AmadeusAuthError without leaking the raw axios error', async () => {
    const post = jest
      .fn()
      .mockReturnValue(
        throwError(() => ({ message: 'network down', response: undefined })),
      );
    const service = new AmadeusAuthService({ post } as any, buildConfig());

    await expect(service.getAccessToken()).rejects.toThrow(AmadeusAuthError);
  });
});
