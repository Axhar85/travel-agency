import { ConfigService } from '@nestjs/config';
import { AmadeusAuthError } from '../amadeus/errors/amadeus.errors';
import { TravelportAuthError } from '../travelport/errors/travelport.errors';
import {
  GdsApiError,
  GdsNotImplementedError,
  OfferExpiredError,
} from './errors/gds.errors';
import { GdsService } from './gds.service';
import {
  FlightOffer,
  GdsClient,
  GdsOrder,
  GdsProviderEntry,
  GdsProviderName,
  PricedOffer,
} from './interfaces/gds-client.interface';

function buildOffer(
  id: string,
  provider: GdsProviderName,
  overrides: Partial<FlightOffer> = {},
): FlightOffer {
  return {
    id,
    provider,
    contentSource: 'GDS',
    itineraries: [],
    price: { currency: 'EUR', total: '100.00', base: '80.00' },
    validatingAirlineCodes: ['PK'],
    ...overrides,
  };
}

function buildClient(
  overrides: Partial<GdsClient> = {},
): jest.Mocked<GdsClient> {
  return {
    searchFlights: jest.fn().mockResolvedValue([]),
    priceOffer: jest.fn(),
    createOrder: jest.fn(),
    issueTicket: jest.fn(),
    getOrder: jest.fn(),
    ...overrides,
  } as jest.Mocked<GdsClient>;
}

function buildService(
  entries: GdsProviderEntry[],
  config: Record<string, unknown> = {},
) {
  const configService = {
    get: (key: string, fallback?: unknown) => config[key] ?? fallback,
  } as unknown as ConfigService;
  return new GdsService(entries, configService);
}

const params = {
  originLocationCode: 'MAD',
  destinationLocationCode: 'LHE',
  departureDate: '2026-10-01',
  adults: 1,
};

describe('GdsService.searchFlights', () => {
  it('merges results from every provider, prefixing ids and stamping the provider', async () => {
    const amadeus = buildClient({
      searchFlights: jest.fn().mockResolvedValue([buildOffer('a1', 'amadeus')]),
    });
    const travelport = buildClient({
      searchFlights: jest
        .fn()
        .mockResolvedValue([buildOffer('t1', 'travelport')]),
    });
    const service = buildService([
      { name: 'amadeus', client: amadeus },
      { name: 'travelport', client: travelport },
    ]);

    const { offers, failedProviders } =
      await service.searchFlightsDetailed(params);

    expect(offers.map((offer) => offer.id)).toEqual([
      'amadeus.a1',
      'travelport.t1',
    ]);
    expect(offers.map((offer) => offer.provider)).toEqual([
      'amadeus',
      'travelport',
    ]);
    expect(failedProviders).toEqual([]);
    expect(amadeus.searchFlights).toHaveBeenCalledWith(params);
    expect(travelport.searchFlights).toHaveBeenCalledWith(params);
  });

  it('returns the working provider’s results when the other one fails, and reports the failure', async () => {
    const amadeus = buildClient({
      searchFlights: jest
        .fn()
        .mockRejectedValue(new AmadeusAuthError('no credentials yet')),
    });
    const travelport = buildClient({
      searchFlights: jest
        .fn()
        .mockResolvedValue([buildOffer('t1', 'travelport')]),
    });
    const service = buildService([
      { name: 'amadeus', client: amadeus },
      { name: 'travelport', client: travelport },
    ]);

    const result = await service.searchFlightsDetailed(params);

    expect(result.offers.map((offer) => offer.id)).toEqual(['travelport.t1']);
    expect(result.failedProviders).toEqual(['amadeus']);
  });

  it('rethrows the first real error when every provider fails, so the filter can map it', async () => {
    const authError = new AmadeusAuthError('no credentials');
    const service = buildService([
      {
        name: 'amadeus',
        client: buildClient({
          searchFlights: jest.fn().mockRejectedValue(authError),
        }),
      },
      {
        name: 'travelport',
        client: buildClient({
          searchFlights: jest
            .fn()
            .mockRejectedValue(new TravelportAuthError('also no credentials')),
        }),
      },
    ]);

    await expect(service.searchFlights(params)).rejects.toBe(authError);
  });

  it('skips a not-implemented provider without marking the search partial', async () => {
    const service = buildService([
      {
        name: 'amadeus',
        client: buildClient({
          searchFlights: jest
            .fn()
            .mockResolvedValue([buildOffer('a1', 'amadeus')]),
        }),
      },
      {
        name: 'travelport',
        client: buildClient({
          searchFlights: jest
            .fn()
            .mockRejectedValue(
              new GdsNotImplementedError('searchFlights', 'later'),
            ),
        }),
      },
    ]);

    const result = await service.searchFlightsDetailed(params);

    expect(result.offers).toHaveLength(1);
    // Not "failed": otherwise every search would skip the cache forever
    // while Travelport is switched on but not built yet.
    expect(result.failedProviders).toEqual([]);
  });

  it('surfaces not-implemented when nothing else could answer', async () => {
    const notImplemented = new GdsNotImplementedError('searchFlights', 'later');
    const service = buildService([
      {
        name: 'travelport',
        client: buildClient({
          searchFlights: jest.fn().mockRejectedValue(notImplemented),
        }),
      },
    ]);

    await expect(service.searchFlights(params)).rejects.toBe(notImplemented);
  });

  it('treats a synchronous throw inside a client as a failure, not a crash', async () => {
    const service = buildService([
      {
        name: 'amadeus',
        client: buildClient({
          searchFlights: jest.fn().mockImplementation(() => {
            throw new Error('boom');
          }),
        }),
      },
      {
        name: 'travelport',
        client: buildClient({
          searchFlights: jest
            .fn()
            .mockResolvedValue([buildOffer('t1', 'travelport')]),
        }),
      },
    ]);

    const result = await service.searchFlightsDetailed(params);

    expect(result.offers).toHaveLength(1);
    expect(result.failedProviders).toEqual(['amadeus']);
  });

  describe('timeout', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    it('reports a hung provider as failed after the timeout instead of stalling the search', async () => {
      const hung = buildClient({
        searchFlights: jest.fn().mockReturnValue(new Promise(() => undefined)),
      });
      const fast = buildClient({
        searchFlights: jest
          .fn()
          .mockResolvedValue([buildOffer('t1', 'travelport')]),
      });
      const service = buildService(
        [
          { name: 'amadeus', client: hung },
          { name: 'travelport', client: fast },
        ],
        { GDS_SEARCH_TIMEOUT_MS: 5000 },
      );

      const pending = service.searchFlightsDetailed(params);
      await jest.advanceTimersByTimeAsync(5000);
      const result = await pending;

      expect(result.offers.map((offer) => offer.id)).toEqual(['travelport.t1']);
      expect(result.failedProviders).toEqual(['amadeus']);
    });

    it('clears its timers once providers answer (no leaked handles)', async () => {
      const service = buildService([
        {
          name: 'amadeus',
          client: buildClient({
            searchFlights: jest.fn().mockResolvedValue([]),
          }),
        },
      ]);

      await service.searchFlightsDetailed(params);

      expect(jest.getTimerCount()).toBe(0);
    });
  });

  it('never merges a private fare away when another provider has a published one on the same flights', async () => {
    const segment = {
      departure: { iataCode: 'MAD', at: '2026-10-01T10:00:00' },
      arrival: { iataCode: 'LHE', at: '2026-10-01T20:00:00' },
      carrierCode: 'PK',
      flightNumber: '100',
      duration: 'PT10H',
      numberOfStops: 0,
    };
    const itineraries = [{ duration: 'PT10H', segments: [segment] }];
    const service = buildService([
      {
        name: 'amadeus',
        client: buildClient({
          searchFlights: jest.fn().mockResolvedValue([
            buildOffer('a1', 'amadeus', {
              itineraries,
              fare: { type: 'PUBLISHED', basisCodes: ['YLOW'] },
              price: { currency: 'EUR', total: '520.00', base: '400.00' },
            }),
          ]),
        }),
      },
      {
        name: 'travelport',
        client: buildClient({
          searchFlights: jest.fn().mockResolvedValue([
            buildOffer('t1', 'travelport', {
              itineraries,
              fare: { type: 'PRIVATE', basisCodes: ['YLOW'] },
              price: { currency: 'EUR', total: '410.00', base: '300.00' },
            }),
          ]),
        }),
      },
    ]);

    const { offers } = await service.searchFlightsDetailed(params);

    expect(offers.map((offer) => offer.id)).toEqual([
      'amadeus.a1',
      'travelport.t1',
    ]);
  });
});

describe('GdsService routing', () => {
  const priced = (id: string, provider: GdsProviderName): PricedOffer => ({
    ...buildOffer(id, provider),
    priceChanged: false,
    originalTotal: '100.00',
  });

  it('routes priceOffer to the provider named in the id, using the native id', async () => {
    const amadeus = buildClient({ priceOffer: jest.fn() });
    const travelport = buildClient({
      priceOffer: jest.fn().mockResolvedValue(priced('native-t', 'travelport')),
    });
    const service = buildService([
      { name: 'amadeus', client: amadeus },
      { name: 'travelport', client: travelport },
    ]);

    const result = await service.priceOffer('travelport.native-t');

    expect(travelport.priceOffer).toHaveBeenCalledWith('native-t');
    expect(amadeus.priceOffer).not.toHaveBeenCalled();
    expect(result.id).toBe('travelport.native-t');
    expect(result.provider).toBe('travelport');
  });

  it('routes an unprefixed legacy id to Amadeus', async () => {
    const amadeus = buildClient({
      priceOffer: jest.fn().mockResolvedValue(priced('legacy-id', 'amadeus')),
    });
    const service = buildService([{ name: 'amadeus', client: amadeus }]);

    const result = await service.priceOffer('legacy-id');

    expect(amadeus.priceOffer).toHaveBeenCalledWith('legacy-id');
    expect(result.id).toBe('amadeus.legacy-id');
  });

  it('treats an offer from a provider that is not enabled as expired', async () => {
    const service = buildService([{ name: 'amadeus', client: buildClient() }]);

    await expect(
      service.priceOffer('travelport.native-t'),
    ).rejects.toBeInstanceOf(OfferExpiredError);
  });

  it('propagates provider errors from priceOffer unchanged', async () => {
    const apiError = new GdsApiError('rate limited', 429, undefined, 'amadeus');
    const service = buildService([
      {
        name: 'amadeus',
        client: buildClient({
          priceOffer: jest.fn().mockRejectedValue(apiError),
        }),
      },
    ]);

    await expect(service.priceOffer('amadeus.x')).rejects.toBe(apiError);
  });

  it('routes createOrder/issueTicket/getOrder and prefixes the order and its offer ids', async () => {
    const order: GdsOrder = {
      id: 'order-native',
      status: 'CREATED',
      offer: buildOffer('offer-native', 'travelport'),
      passengers: [],
      createdAt: '2026-10-01T00:00:00Z',
    };
    const travelport = buildClient({
      createOrder: jest.fn().mockResolvedValue(order),
      issueTicket: jest.fn().mockResolvedValue(order),
      getOrder: jest.fn().mockResolvedValue(order),
    });
    const service = buildService([{ name: 'travelport', client: travelport }]);

    const created = await service.createOrder('travelport.offer-native', []);
    await service.issueTicket('travelport.order-native');
    const fetched = await service.getOrder('travelport.order-native');

    expect(travelport.createOrder).toHaveBeenCalledWith('offer-native', []);
    expect(travelport.issueTicket).toHaveBeenCalledWith('order-native');
    expect(travelport.getOrder).toHaveBeenCalledWith('order-native');
    expect(created.id).toBe('travelport.order-native');
    expect(created.offer.id).toBe('travelport.offer-native');
    expect(fetched.offer.provider).toBe('travelport');
  });

  it('reports which providers are enabled', () => {
    const service = buildService([{ name: 'amadeus', client: buildClient() }]);

    expect(service.providerNames()).toEqual(['amadeus']);
    expect(service.isEnabled('amadeus')).toBe(true);
    expect(service.isEnabled('travelport')).toBe(false);
  });
});
