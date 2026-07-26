import { validateEnv } from './env.validation';

function baseConfig(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    CORS_ORIGIN: 'http://localhost:3000',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    REDIS_URL: 'redis://localhost:6379',
    AMADEUS_MODE: 'self-service',
    AMADEUS_API_BASE_URL: 'https://test.api.amadeus.com',
    SESSION_SECRET: 'test-secret',
    ...overrides,
  };
}

describe('validateEnv', () => {
  it('accepts a valid config with default cache TTLs', () => {
    expect(() => validateEnv(baseConfig())).not.toThrow();
  });

  it('accepts SEARCH_RESULTS_CACHE_TTL_SECONDS equal to AMADEUS_OFFER_CACHE_TTL_SECONDS', () => {
    expect(() =>
      validateEnv(
        baseConfig({
          SEARCH_RESULTS_CACHE_TTL_SECONDS: 900,
          AMADEUS_OFFER_CACHE_TTL_SECONDS: 900,
        }),
      ),
    ).not.toThrow();
  });

  it('rejects a search-results cache TTL longer than the offer cache TTL', () => {
    expect(() =>
      validateEnv(
        baseConfig({
          SEARCH_RESULTS_CACHE_TTL_SECONDS: 1000,
          AMADEUS_OFFER_CACHE_TTL_SECONDS: 900,
        }),
      ),
    ).toThrow(/SEARCH_RESULTS_CACHE_TTL_SECONDS/);
  });
});
