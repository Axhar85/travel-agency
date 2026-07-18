import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchFlightsQueryDto } from './dto/search-flights-query.dto';
import { PriceOfferParamsDto } from './dto/price-offer-params.dto';

describe('SearchController', () => {
  it('delegates searchFlights to SearchService', async () => {
    const searchService = {
      searchFlights: jest.fn().mockResolvedValue({ offers: [], cached: false }),
      priceOffer: jest.fn(),
    } as unknown as SearchService;
    const controller = new SearchController(searchService);
    const query = new SearchFlightsQueryDto();

    await controller.searchFlights(query);

    expect(searchService.searchFlights).toHaveBeenCalledWith(query);
  });

  it('delegates priceOffer to SearchService', async () => {
    const searchService = {
      searchFlights: jest.fn(),
      priceOffer: jest.fn().mockResolvedValue({}),
    } as unknown as SearchService;
    const controller = new SearchController(searchService);
    const params: PriceOfferParamsDto = {
      offerId: '11111111-1111-1111-1111-111111111111',
    };

    await controller.priceOffer(params);

    expect(searchService.priceOffer).toHaveBeenCalledWith(params.offerId);
  });
});
