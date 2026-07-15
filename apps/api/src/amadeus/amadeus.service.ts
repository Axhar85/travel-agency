import { Inject, Injectable } from '@nestjs/common';
import { GDS_CLIENT } from './amadeus.constants';
import type {
  FlightOffer,
  GdsClient,
  GdsOrder,
  Passenger,
  PricedOffer,
  SearchFlightsParams,
} from './interfaces/gds-client.interface';

/**
 * The single entry point the rest of the app depends on. Everything outside
 * AmadeusModule injects this class — never the concrete self-service/
 * enterprise client, and never the GDS_CLIENT token directly. Swapping
 * AMADEUS_MODE only changes which client is bound to GDS_CLIENT in
 * amadeus.module.ts; this facade and its callers never change.
 */
@Injectable()
export class AmadeusService implements GdsClient {
  constructor(@Inject(GDS_CLIENT) private readonly client: GdsClient) {}

  searchFlights(params: SearchFlightsParams): Promise<FlightOffer[]> {
    return this.client.searchFlights(params);
  }

  priceOffer(offerId: string): Promise<PricedOffer> {
    return this.client.priceOffer(offerId);
  }

  createOrder(offerId: string, passengers: Passenger[]): Promise<GdsOrder> {
    return this.client.createOrder(offerId, passengers);
  }

  issueTicket(orderId: string): Promise<GdsOrder> {
    return this.client.issueTicket(orderId);
  }

  getOrder(orderId: string): Promise<GdsOrder> {
    return this.client.getOrder(orderId);
  }
}
