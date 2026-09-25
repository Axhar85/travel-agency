import { ConfigService } from '@nestjs/config';
import { GdsService } from '../gds/gds.service';
import { FlightOffer } from '../gds/interfaces/gds-client.interface';
import { SearchFlightsQueryDto } from './dto/search-flights-query.dto';
import { SearchService } from './search.service';

const offer: FlightOffer = {
  id: 'amadeus.offer-1',
  provider: 'amadeus',
  contentSource: 'GDS',
  itineraries: [],
  price: { currency: 'EUR', total: '199.99', base: '150.00' },
  validatingAirlineCodes: ['IB'],
};

function buildQuery(
  overrides: Partial<SearchFlightsQueryDto> = {},
): SearchFlightsQueryDto {
  const dto = new SearchFlightsQueryDto();
  dto.origin = 'MAD';
  dto.destination = 'JFK';
  dto.departureDate = '2026-08-01';
  dto.adults = 1;
  Object.assign(dto, overrides);
  return dto;
}

describe('SearchService', () => {
  function buildService() {
    const store = new Map<string, string>();
    const redis = {
      get: jest.fn(async (key: string) => store.get(key) ?? null),
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
    } as any;
    const gdsService = {
      searchFlightsDetailed: jest
        .fn()
        .mockResolvedValue({ offers: [offer], failedProviders: [] }),
      priceOffer: jest.fn().mockResolvedValue({
        ...offer,
        priceChanged: false,
        originalTotal: '199.99',
      }),
    } as unknown as GdsService;
    const config = { get: () => 300 } as unknown as ConfigService;
    const service = new SearchService(gdsService, redis, config);
    return { service, redis, gdsService };
  }

  it('calls GdsService and caches the result on a cache miss', async () => {
    const { service, redis, gdsService } = buildService();

    const result = await service.searchFlights(buildQuery());

    expect(result).toEqual({ offers: [offer], cached: false });
    expect(gdsService.searchFlightsDetailed).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('search:flights:'),
      JSON.stringify([offer]),
      'EX',
      300,
    );
  });

  it('returns the cached result without calling GdsService again for an equivalent search', async () => {
    const { service, gdsService } = buildService();

    await service.searchFlights(buildQuery());
    const second = await service.searchFlights(buildQuery());

    expect(second).toEqual({ offers: [offer], cached: true });
    expect(gdsService.searchFlightsDetailed).toHaveBeenCalledTimes(1);
  });

  it('treats searches with different params as separate cache entries', async () => {
    const { service, gdsService } = buildService();

    await service.searchFlights(buildQuery());
    await service.searchFlights(buildQuery({ destination: 'LHR' }));

    expect(gdsService.searchFlightsDetailed).toHaveBeenCalledTimes(2);
  });

  it('does not cache a partial result when a provider failed, so a recovered provider is queried again', async () => {
    const { service, redis, gdsService } = buildService();
    (gdsService.searchFlightsDetailed as jest.Mock).mockResolvedValue({
      offers: [offer],
      failedProviders: ['travelport'],
    });

    const first = await service.searchFlights(buildQuery());
    const second = await service.searchFlights(buildQuery());

    // Still returns what it has - a partial list beats an error page...
    expect(first).toEqual({ offers: [offer], cached: false });
    // ...but never stores it, so the next search retries every provider.
    expect(redis.set).not.toHaveBeenCalled();
    expect(second.cached).toBe(false);
    expect(gdsService.searchFlightsDetailed).toHaveBeenCalledTimes(2);
  });

  it('delegates priceOffer to GdsService', async () => {
    const { service, gdsService } = buildService();

    const priced = await service.priceOffer('amadeus.offer-1');

    expect(gdsService.priceOffer).toHaveBeenCalledWith('amadeus.offer-1');
    expect(priced.priceChanged).toBe(false);
  });

  it('falls back to an uncached GDS call when Redis read fails, instead of throwing', async () => {
    const { service, gdsService } = buildService();
    service['redis'].get = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.searchFlights(buildQuery());

    expect(result).toEqual({ offers: [offer], cached: false });
    expect(gdsService.searchFlightsDetailed).toHaveBeenCalledTimes(1);
  });

  it('still returns search results when Redis write fails, instead of throwing', async () => {
    const { service, gdsService } = buildService();
    service['redis'].set = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.searchFlights(buildQuery());

    expect(result).toEqual({ offers: [offer], cached: false });
    expect(gdsService.searchFlightsDetailed).toHaveBeenCalledTimes(1);
  });
});
