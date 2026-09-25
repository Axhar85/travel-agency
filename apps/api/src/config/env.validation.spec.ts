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

  it('defaults GDS_PROVIDERS to Amadeus only, so adding Travelport never changes an existing environment', () => {
    expect(validateEnv(baseConfig()).GDS_PROVIDERS).toBe('amadeus');
  });

  it('accepts a multi-provider GDS_PROVIDERS list', () => {
    expect(() =>
      validateEnv(baseConfig({ GDS_PROVIDERS: 'amadeus,travelport' })),
    ).not.toThrow();
  });

  it('rejects an unknown GDS provider at boot with a clear message', () => {
    expect(() =>
      validateEnv(baseConfig({ GDS_PROVIDERS: 'amadeus,sabre' })),
    ).toThrow(/GDS_PROVIDERS.*sabre/);
  });

  it('defaults Travelport to pre-production and rejects an unknown environment', () => {
    expect(validateEnv(baseConfig()).TRAVELPORT_ENV).toBe('preproduction');
    expect(() =>
      validateEnv(baseConfig({ TRAVELPORT_ENV: 'staging' })),
    ).toThrow(/TRAVELPORT_ENV/);
  });

  it('allows empty Travelport credentials at boot (only the provider fails, not startup)', () => {
    expect(() =>
      validateEnv(baseConfig({ GDS_PROVIDERS: 'amadeus,travelport' })),
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
