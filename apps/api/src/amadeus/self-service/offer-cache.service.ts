import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import { AmadeusRawFlightOffer } from './amadeus-response.types';

const CACHE_KEY_PREFIX = 'amadeus:offer:';

/**
 * Amadeus Self-Service is stateless — Flight Offers Price needs the full
 * offer payload back, not just an id. We cache the raw offer in Redis keyed
 * by an id we generate, so the rest of the app can deal in offerId strings
 * (matching the GdsClient interface) instead of passing raw GDS payloads
 * around. Short TTL because fares are volatile (also serves as the Phase 2
 * "search results cached in Redis" requirement for this raw-offer lookup).
 */
@Injectable()
export class OfferCacheService {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.ttlSeconds = config.get<number>(
      'AMADEUS_OFFER_CACHE_TTL_SECONDS',
      900,
    );
  }

  async store(rawOffer: AmadeusRawFlightOffer): Promise<string> {
    const id = randomUUID();
    await this.redis.set(
      CACHE_KEY_PREFIX + id,
      JSON.stringify(rawOffer),
      'EX',
      this.ttlSeconds,
    );
    return id;
  }

  async get(offerId: string): Promise<AmadeusRawFlightOffer | null> {
    const raw = await this.redis.get(CACHE_KEY_PREFIX + offerId);
    return raw ? (JSON.parse(raw) as AmadeusRawFlightOffer) : null;
  }
}
