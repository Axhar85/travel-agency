import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { dedupeOffers } from './dedupe-offers';
import {
  GdsApiError,
  GdsNotImplementedError,
  OfferExpiredError,
} from './errors/gds.errors';
import { GDS_PROVIDERS } from './gds.constants';
import {
  FlightOffer,
  GdsClient,
  GdsOrder,
  GdsProviderEntry,
  GdsProviderName,
  Passenger,
  PricedOffer,
  SearchFlightsParams,
} from './interfaces/gds-client.interface';
import { decodeOfferId, encodeOfferId } from './offer-id';

export interface AggregatedSearchResult {
  offers: FlightOffer[];
  /**
   * Providers that errored or timed out on this search. Non-empty means the
   * offer list is incomplete - callers must not cache it as if it were whole.
   * Providers that are merely not implemented yet are skipped, not "failed".
   */
  failedProviders: GdsProviderName[];
}

const DEFAULT_SEARCH_TIMEOUT_MS = 12_000;

/**
 * The single entry point the rest of the app depends on for flights. Fans a
 * search out to every enabled provider (Amadeus, Travelport/Galileo, ...),
 * merges the normalized results, and routes price/order calls back to the
 * provider that owns the offer id. Everything outside gds/ and the provider
 * modules injects this class - never a concrete provider client.
 */
@Injectable()
export class GdsService implements GdsClient {
  private readonly logger = new Logger(GdsService.name);
  private readonly searchTimeoutMs: number;

  constructor(
    @Inject(GDS_PROVIDERS) private readonly providers: GdsProviderEntry[],
    config: ConfigService,
  ) {
    this.searchTimeoutMs = config.get<number>(
      'GDS_SEARCH_TIMEOUT_MS',
      DEFAULT_SEARCH_TIMEOUT_MS,
    );
  }

  providerNames(): GdsProviderName[] {
    return this.providers.map((provider) => provider.name);
  }

  isEnabled(name: GdsProviderName): boolean {
    return this.providers.some((provider) => provider.name === name);
  }

  async searchFlights(params: SearchFlightsParams): Promise<FlightOffer[]> {
    return (await this.searchFlightsDetailed(params)).offers;
  }

  async searchFlightsDetailed(
    params: SearchFlightsParams,
  ): Promise<AggregatedSearchResult> {
    const settled = await Promise.allSettled(
      this.providers.map((provider) =>
        this.withTimeout(
          // async wrapper so a synchronous throw inside a client is still
          // captured as a rejection instead of escaping allSettled.
          (async () => provider.client.searchFlights(params))(),
          provider.name,
        ),
      ),
    );

    const offers: FlightOffer[] = [];
    const failed: { name: GdsProviderName; reason: unknown }[] = [];
    const skipped: unknown[] = [];

    settled.forEach((result, index) => {
      const { name } = this.providers[index];

      if (result.status === 'fulfilled') {
        for (const offer of result.value) {
          offers.push({
            ...offer,
            id: encodeOfferId(name, offer.id),
            provider: name,
          });
        }
        return;
      }

      if (result.reason instanceof GdsNotImplementedError) {
        this.logger.debug(`${name} skipped: ${result.reason.message}`);
        skipped.push(result.reason);
        return;
      }

      this.logger.warn(
        `${name} search failed: ${(result.reason as Error)?.message ?? String(result.reason)}`,
      );
      failed.push({ name, reason: result.reason });
    });

    const succeeded = settled.length - failed.length - skipped.length;
    if (succeeded === 0) {
      // Nothing usable came back at all - surface the first real error so
      // GdsExceptionFilter can map it (auth -> 503, upstream 4xx -> 400, ...).
      throw failed[0]?.reason ?? skipped[0];
    }

    return {
      offers: dedupeOffers(offers),
      failedProviders: failed.map((entry) => entry.name),
    };
  }

  async priceOffer(offerId: string): Promise<PricedOffer> {
    const { entry, nativeId } = this.route(offerId);
    const priced = await entry.client.priceOffer(nativeId);
    return {
      ...priced,
      id: encodeOfferId(entry.name, priced.id),
      provider: entry.name,
    };
  }

  async createOrder(
    offerId: string,
    passengers: Passenger[],
  ): Promise<GdsOrder> {
    const { entry, nativeId } = this.route(offerId);
    return this.tagOrder(
      entry.name,
      await entry.client.createOrder(nativeId, passengers),
    );
  }

  async issueTicket(orderId: string): Promise<GdsOrder> {
    const { entry, nativeId } = this.route(orderId);
    return this.tagOrder(entry.name, await entry.client.issueTicket(nativeId));
  }

  async getOrder(orderId: string): Promise<GdsOrder> {
    const { entry, nativeId } = this.route(orderId);
    return this.tagOrder(entry.name, await entry.client.getOrder(nativeId));
  }

  /**
   * Resolves the owning provider from an offer/order id. An id whose provider
   * isn't enabled (e.g. Travelport switched off after the customer searched)
   * is treated as expired - the customer's remedy is the same: search again.
   */
  private route(id: string): { entry: GdsProviderEntry; nativeId: string } {
    const { provider, nativeId } = decodeOfferId(id);
    const entry = this.providers.find(
      (candidate) => candidate.name === provider,
    );
    if (!entry) {
      throw new OfferExpiredError(id);
    }
    return { entry, nativeId };
  }

  private tagOrder(provider: GdsProviderName, order: GdsOrder): GdsOrder {
    return {
      ...order,
      id: encodeOfferId(provider, order.id),
      offer: {
        ...order.offer,
        id: encodeOfferId(provider, order.offer.id),
        provider,
      },
    };
  }

  private withTimeout<T>(
    promise: Promise<T>,
    provider: GdsProviderName,
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new GdsApiError(
              `${provider} search timed out after ${this.searchTimeoutMs}ms`,
              undefined,
              undefined,
              provider,
            ),
          ),
        this.searchTimeoutMs,
      );
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }
}
