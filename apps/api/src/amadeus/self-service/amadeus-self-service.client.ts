import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { firstValueFrom } from 'rxjs';
import {
  AmadeusApiError,
  GdsNotImplementedError,
  OfferExpiredError,
} from '../errors/amadeus.errors';
import {
  FlightOffer,
  GdsClient,
  GdsOrder,
  Passenger,
  PricedOffer,
  SearchFlightsParams,
} from '../interfaces/gds-client.interface';
import { AmadeusAuthService } from './amadeus-auth.service';
import { toFlightOffer } from './amadeus.mapper';
import {
  AmadeusFlightOffersPricingResponse,
  AmadeusFlightOffersSearchResponse,
} from './amadeus-response.types';
import { OfferCacheService } from './offer-cache.service';

@Injectable()
export class AmadeusSelfServiceClient implements GdsClient {
  private readonly logger = new Logger(AmadeusSelfServiceClient.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly auth: AmadeusAuthService,
    private readonly offerCache: OfferCacheService,
  ) {}

  async searchFlights(params: SearchFlightsParams): Promise<FlightOffer[]> {
    const token = await this.auth.getAccessToken();
    const baseUrl = this.config.getOrThrow<string>('AMADEUS_API_BASE_URL');

    try {
      const response = await firstValueFrom(
        this.httpService.get<AmadeusFlightOffersSearchResponse>(
          `${baseUrl}/v2/shopping/flight-offers`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: this.buildSearchQuery(params),
          },
        ),
      );

      return Promise.all(
        response.data.data.map(async (rawOffer) => {
          const id = await this.offerCache.store(rawOffer);
          return toFlightOffer(rawOffer, id);
        }),
      );
    } catch (error) {
      throw this.toApiError(error, 'searchFlights');
    }
  }

  async priceOffer(offerId: string): Promise<PricedOffer> {
    const cachedOffer = await this.offerCache.get(offerId);
    if (!cachedOffer) {
      throw new OfferExpiredError(offerId);
    }

    const token = await this.auth.getAccessToken();
    const baseUrl = this.config.getOrThrow<string>('AMADEUS_API_BASE_URL');

    try {
      const response = await firstValueFrom(
        this.httpService.post<AmadeusFlightOffersPricingResponse>(
          `${baseUrl}/v1/shopping/flight-offers/pricing`,
          {
            data: {
              type: 'flight-offers-pricing',
              flightOffers: [cachedOffer],
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/vnd.amadeus+json',
            },
          },
        ),
      );

      const [repriced] = response.data.data.flightOffers;
      const newId = await this.offerCache.store(repriced);
      const normalized = toFlightOffer(repriced, newId);

      return {
        ...normalized,
        originalTotal: cachedOffer.price.total,
        priceChanged: repriced.price.total !== cachedOffer.price.total,
      };
    } catch (error) {
      throw this.toApiError(error, 'priceOffer');
    }
  }

  createOrder(_offerId: string, _passengers: Passenger[]): Promise<GdsOrder> {
    return Promise.reject(new GdsNotImplementedError('createOrder', 'Phase 5'));
  }

  issueTicket(_orderId: string): Promise<GdsOrder> {
    return Promise.reject(new GdsNotImplementedError('issueTicket', 'Phase 5'));
  }

  getOrder(_orderId: string): Promise<GdsOrder> {
    return Promise.reject(new GdsNotImplementedError('getOrder', 'Phase 5'));
  }

  private buildSearchQuery(
    params: SearchFlightsParams,
  ): Record<string, string | number | boolean> {
    const query: Record<string, string | number | boolean> = {
      originLocationCode: params.originLocationCode,
      destinationLocationCode: params.destinationLocationCode,
      departureDate: params.departureDate,
      adults: params.adults,
    };

    if (params.returnDate) query.returnDate = params.returnDate;
    if (params.children) query.children = params.children;
    if (params.infants) query.infants = params.infants;
    if (params.travelClass) query.travelClass = params.travelClass;
    if (params.nonStop !== undefined) query.nonStop = params.nonStop;
    if (params.currencyCode) query.currencyCode = params.currencyCode;
    if (params.maxResults) query.max = params.maxResults;

    return query;
  }

  private toApiError(error: unknown, method: string): AmadeusApiError {
    const axiosError = error as AxiosError<{ errors?: { detail?: string }[] }>;
    const detail =
      axiosError.response?.data?.errors?.[0]?.detail ?? axiosError.message;
    this.logger.error(`Amadeus ${method} failed: ${detail}`);
    return new AmadeusApiError(
      `Amadeus ${method} failed: ${detail}`,
      axiosError.response?.status,
      axiosError.response?.data,
    );
  }
}
