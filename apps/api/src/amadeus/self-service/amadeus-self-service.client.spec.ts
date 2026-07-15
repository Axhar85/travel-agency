import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import {
  AmadeusApiError,
  GdsNotImplementedError,
  OfferExpiredError,
} from '../errors/amadeus.errors';
import { AmadeusAuthService } from './amadeus-auth.service';
import { AmadeusSelfServiceClient } from './amadeus-self-service.client';
import { OfferCacheService } from './offer-cache.service';

const rawOffer = {
  id: 'amadeus-raw-1',
  source: 'GDS',
  itineraries: [
    {
      duration: 'PT2H30M',
      segments: [
        {
          departure: { iataCode: 'MAD', at: '2026-08-01T09:00:00' },
          arrival: { iataCode: 'JFK', at: '2026-08-01T12:30:00' },
          carrierCode: 'IB',
          number: '123',
          aircraft: { code: '789' },
          duration: 'PT2H30M',
          numberOfStops: 0,
        },
      ],
    },
  ],
  price: { currency: 'EUR', total: '199.99', base: '150.00' },
  numberOfBookableSeats: 9,
  validatingAirlineCodes: ['IB'],
};

function buildConfig(): ConfigService {
  return {
    getOrThrow: (key: string) => {
      if (key === 'AMADEUS_API_BASE_URL') return 'https://test.api.amadeus.com';
      throw new Error(`unexpected config key ${key}`);
    },
  } as unknown as ConfigService;
}

describe('AmadeusSelfServiceClient', () => {
  function buildClient(overrides: { get?: jest.Mock; post?: jest.Mock } = {}) {
    const httpService = {
      get: overrides.get ?? jest.fn(),
      post: overrides.post ?? jest.fn(),
    } as any;
    const auth = {
      getAccessToken: jest.fn().mockResolvedValue('test-token'),
    } as unknown as AmadeusAuthService;
    const offerCache = new OfferCacheService(
      (() => {
        const store = new Map<string, string>();
        return {
          set: jest.fn(async (key: string, value: string) => {
            store.set(key, value);
            return 'OK';
          }),
          get: jest.fn(async (key: string) => store.get(key) ?? null),
        } as any;
      })(),
      { get: () => 900 } as unknown as ConfigService,
    );
    const client = new AmadeusSelfServiceClient(
      httpService,
      buildConfig(),
      auth,
      offerCache,
    );
    return { client, httpService, auth, offerCache };
  }

  it('searchFlights normalizes raw Amadeus offers and caches them for later pricing', async () => {
    const get = jest.fn().mockReturnValue(of({ data: { data: [rawOffer] } }));
    const { client } = buildClient({ get });

    const offers = await client.searchFlights({
      originLocationCode: 'MAD',
      destinationLocationCode: 'JFK',
      departureDate: '2026-08-01',
      adults: 1,
    });

    expect(offers).toHaveLength(1);
    expect(offers[0]).toMatchObject({
      contentSource: 'GDS',
      price: { currency: 'EUR', total: '199.99', base: '150.00' },
      validatingAirlineCodes: ['IB'],
    });
    // id must be our generated cache id, not Amadeus's raw offer id
    expect(offers[0].id).not.toBe(rawOffer.id);
    expect(offers[0].itineraries[0].segments[0]).toMatchObject({
      departure: { iataCode: 'MAD', at: '2026-08-01T09:00:00' },
      carrierCode: 'IB',
      flightNumber: '123',
      aircraftCode: '789',
      numberOfStops: 0,
    });
  });

  it('wraps search HTTP failures in AmadeusApiError with response detail, not the raw axios error', async () => {
    const get = jest.fn().mockReturnValue(
      throwError(() => ({
        message: 'Request failed',
        response: {
          status: 400,
          data: { errors: [{ detail: 'Invalid airport code' }] },
        },
      })),
    );
    const { client } = buildClient({ get });

    await expect(
      client.searchFlights({
        originLocationCode: 'XXX',
        destinationLocationCode: 'JFK',
        departureDate: '2026-08-01',
        adults: 1,
      }),
    ).rejects.toThrow(AmadeusApiError);
  });

  it('priceOffer throws OfferExpiredError when the offer id is not cached', async () => {
    const { client } = buildClient();

    await expect(client.priceOffer('unknown-id')).rejects.toThrow(
      OfferExpiredError,
    );
  });

  it('priceOffer flags priceChanged when the repriced total differs from the cached total', async () => {
    const get = jest.fn().mockReturnValue(of({ data: { data: [rawOffer] } }));
    const post = jest.fn().mockReturnValue(
      of({
        data: {
          data: {
            flightOffers: [
              { ...rawOffer, price: { ...rawOffer.price, total: '219.99' } },
            ],
          },
        },
      }),
    );
    const { client } = buildClient({ get, post });

    const [searched] = await client.searchFlights({
      originLocationCode: 'MAD',
      destinationLocationCode: 'JFK',
      departureDate: '2026-08-01',
      adults: 1,
    });
    const priced = await client.priceOffer(searched.id);

    expect(priced.priceChanged).toBe(true);
    expect(priced.originalTotal).toBe('199.99');
    expect(priced.price.total).toBe('219.99');
  });

  it('priceOffer reports priceChanged=false when the total is unchanged', async () => {
    const get = jest.fn().mockReturnValue(of({ data: { data: [rawOffer] } }));
    const post = jest
      .fn()
      .mockReturnValue(of({ data: { data: { flightOffers: [rawOffer] } } }));
    const { client } = buildClient({ get, post });

    const [searched] = await client.searchFlights({
      originLocationCode: 'MAD',
      destinationLocationCode: 'JFK',
      departureDate: '2026-08-01',
      adults: 1,
    });
    const priced = await client.priceOffer(searched.id);

    expect(priced.priceChanged).toBe(false);
  });

  it('createOrder, issueTicket, and getOrder are not implemented yet (Phase 5)', async () => {
    const { client } = buildClient();

    await expect(client.createOrder('offer-1', [])).rejects.toThrow(
      GdsNotImplementedError,
    );
    await expect(client.issueTicket('order-1')).rejects.toThrow(
      GdsNotImplementedError,
    );
    await expect(client.getOrder('order-1')).rejects.toThrow(
      GdsNotImplementedError,
    );
  });
});
