import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type Redis from 'ioredis';
import { AmadeusService } from '../amadeus/amadeus.service';
import {
  FlightOffer,
  PricedOffer,
  SearchFlightsParams,
} from '../amadeus/interfaces/gds-client.interface';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { SearchFlightsQueryDto } from './dto/search-flights-query.dto';

const CACHE_KEY_PREFIX = 'search:flights:';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private readonly ttlSeconds: number;

  constructor(
    private readonly amadeusService: AmadeusService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.ttlSeconds = config.get<number>(
      'SEARCH_RESULTS_CACHE_TTL_SECONDS',
      300,
    );
  }

  async searchFlights(
    query: SearchFlightsQueryDto,
  ): Promise<{ offers: FlightOffer[]; cached: boolean }> {
    const params = this.toSearchParams(query);
    const cacheKey = this.buildCacheKey(params);

    // Redis is a performance optimization for search, not a hard dependency —
    // a Redis outage should degrade to an uncached Amadeus call, not fail the
    // whole search with a 500. Errors are handled locally rather than left
    // for AmadeusExceptionFilter, which only knows about Amadeus's own
    // domain errors.
    const cached = await this.tryReadCache(cacheKey);
    if (cached) {
      this.logger.debug(`Search cache hit for ${cacheKey}`);
      return { offers: cached, cached: true };
    }

    const offers = await this.amadeusService.searchFlights(params);
    await this.tryWriteCache(cacheKey, offers);

    return { offers, cached: false };
  }

  private async tryReadCache(cacheKey: string): Promise<FlightOffer[] | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? (JSON.parse(cached) as FlightOffer[]) : null;
    } catch (error) {
      this.logger.error(
        `Search cache read failed, continuing without it: ${(error as Error).message}`,
      );
      return null;
    }
  }

  private async tryWriteCache(
    cacheKey: string,
    offers: FlightOffer[],
  ): Promise<void> {
    try {
      await this.redis.set(
        cacheKey,
        JSON.stringify(offers),
        'EX',
        this.ttlSeconds,
      );
    } catch (error) {
      this.logger.error(
        `Search cache write failed, continuing without it: ${(error as Error).message}`,
      );
    }
  }

  priceOffer(offerId: string): Promise<PricedOffer> {
    return this.amadeusService.priceOffer(offerId);
  }

  private toSearchParams(query: SearchFlightsQueryDto): SearchFlightsParams {
    return {
      originLocationCode: query.origin,
      destinationLocationCode: query.destination,
      departureDate: query.departureDate,
      returnDate: query.returnDate,
      adults: query.adults,
      children: query.children,
      infants: query.infants,
      travelClass: query.cabinClass,
      nonStop: query.nonStop,
      currencyCode: query.currencyCode,
    };
  }

  /** Deterministic key from normalized, sorted params so equivalent searches always hit the same cache entry. */
  private buildCacheKey(params: SearchFlightsParams): string {
    const normalized = Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const value = params[key as keyof SearchFlightsParams];
        if (value !== undefined) acc[key] = value;
        return acc;
      }, {});

    const hash = createHash('sha256')
      .update(JSON.stringify(normalized))
      .digest('hex');
    return `${CACHE_KEY_PREFIX}${hash}`;
  }
}
