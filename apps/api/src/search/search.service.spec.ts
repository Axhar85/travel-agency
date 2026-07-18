import { ConfigService } from '@nestjs/config';
import { AmadeusService } from '../amadeus/amadeus.service';
import { FlightOffer } from '../amadeus/interfaces/gds-client.interface';
import { SearchFlightsQueryDto } from './dto/search-flights-query.dto';
import { SearchService } from './search.service';

const offer: FlightOffer = {
  id: 'offer-1',
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
    const amadeusService = {
      searchFlights: jest.fn().mockResolvedValue([offer]),
      priceOffer: jest.fn().mockResolvedValue({
        ...offer,
        priceChanged: false,
        originalTotal: '199.99',
      }),
    } as unknown as AmadeusService;
    const config = { get: () => 300 } as unknown as ConfigService;
    const service = new SearchService(amadeusService, redis, config);
    return { service, redis, amadeusService };
  }

  it('calls AmadeusService and caches the result on a cache miss', async () => {
    const { service, redis, amadeusService } = buildService();

    const result = await service.searchFlights(buildQuery());

    expect(result).toEqual({ offers: [offer], cached: false });
    expect(amadeusService.searchFlights).toHaveBeenCalledTimes(1);
    expect(redis.set).toHaveBeenCalledWith(
      expect.stringContaining('search:flights:'),
      JSON.stringify([offer]),
      'EX',
      300,
    );
  });

  it('returns the cached result without calling AmadeusService again for an equivalent search', async () => {
    const { service, amadeusService } = buildService();

    await service.searchFlights(buildQuery());
    const second = await service.searchFlights(buildQuery());

    expect(second).toEqual({ offers: [offer], cached: true });
    expect(amadeusService.searchFlights).toHaveBeenCalledTimes(1);
  });

  it('treats searches with different params as separate cache entries', async () => {
    const { service, amadeusService } = buildService();

    await service.searchFlights(buildQuery());
    await service.searchFlights(buildQuery({ destination: 'LHR' }));

    expect(amadeusService.searchFlights).toHaveBeenCalledTimes(2);
  });

  it('delegates priceOffer to AmadeusService', async () => {
    const { service, amadeusService } = buildService();

    const priced = await service.priceOffer('offer-1');

    expect(amadeusService.priceOffer).toHaveBeenCalledWith('offer-1');
    expect(priced.priceChanged).toBe(false);
  });

  it('falls back to an uncached Amadeus call when Redis read fails, instead of throwing', async () => {
    const { service, amadeusService } = buildService();
    service['redis'].get = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.searchFlights(buildQuery());

    expect(result).toEqual({ offers: [offer], cached: false });
    expect(amadeusService.searchFlights).toHaveBeenCalledTimes(1);
  });

  it('still returns search results when Redis write fails, instead of throwing', async () => {
    const { service, amadeusService } = buildService();
    service['redis'].set = jest
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.searchFlights(buildQuery());

    expect(result).toEqual({ offers: [offer], cached: false });
    expect(amadeusService.searchFlights).toHaveBeenCalledTimes(1);
  });
});
