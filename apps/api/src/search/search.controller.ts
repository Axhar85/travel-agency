import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  FlightOffer,
  PricedOffer,
} from '../amadeus/interfaces/gds-client.interface';
import { PriceOfferParamsDto } from './dto/price-offer-params.dto';
import { SearchFlightsQueryDto } from './dto/search-flights-query.dto';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('flights')
  searchFlights(
    @Query() query: SearchFlightsQueryDto,
  ): Promise<{ offers: FlightOffer[]; cached: boolean }> {
    return this.searchService.searchFlights(query);
  }

  @Post('offers/:offerId/price')
  priceOffer(@Param() params: PriceOfferParamsDto): Promise<PricedOffer> {
    return this.searchService.priceOffer(params.offerId);
  }
}
