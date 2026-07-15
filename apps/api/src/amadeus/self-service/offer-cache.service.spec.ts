import { ConfigService } from '@nestjs/config';
import { AmadeusRawFlightOffer } from './amadeus-response.types';
import { OfferCacheService } from './offer-cache.service';

const rawOffer = {
  id: 'amadeus-raw-1',
  source: 'GDS',
  itineraries: [],
  price: { currency: 'EUR', total: '199.99', base: '150.00' },
} as unknown as AmadeusRawFlightOffer;

describe('OfferCacheService', () => {
  it('stores an offer and returns a generated id that can look it up again', async () => {
    const store = new Map<string, string>();
    const redis = {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
    } as any;
    const config = { get: () => 900 } as unknown as ConfigService;
    const service = new OfferCacheService(redis, config);

    const id = await service.store(rawOffer);
    const retrieved = await service.get(id);

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(retrieved).toEqual(rawOffer);
    expect(redis.set).toHaveBeenCalledWith(
      `amadeus:offer:${id}`,
      JSON.stringify(rawOffer),
      'EX',
      900,
    );
  });

  it('returns null for an unknown or expired offer id', async () => {
    const redis = { set: jest.fn(), get: jest.fn(async () => null) } as any;
    const config = { get: () => 900 } as unknown as ConfigService;
    const service = new OfferCacheService(redis, config);

    const retrieved = await service.get('does-not-exist');

    expect(retrieved).toBeNull();
  });
});
