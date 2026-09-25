import { Injectable } from '@nestjs/common';
import { GdsNotImplementedError } from '../gds/errors/gds.errors';
import {
  FlightOffer,
  GdsClient,
  GdsOrder,
  Passenger,
  PricedOffer,
  SearchFlightsParams,
} from '../gds/interfaces/gds-client.interface';

/**
 * Travelport (Galileo) provider - deliberately a skeleton for now.
 *
 * Authentication is real (see TravelportAuthService), but every GdsClient
 * method throws GdsNotImplementedError *before* any network call: Travelport's
 * Search response is a deeply nested reference structure (offers point into a
 * shared ReferenceList of flights/products/brands), and mapping it into our
 * normalized FlightOffer without a real response sample would mean guessing.
 * GdsService treats "not implemented" as a skipped provider, so enabling
 * travelport in GDS_PROVIDERS today is harmless: Amadeus results still flow
 * and search caching is unaffected.
 *
 * Next step, once trial credentials exist: capture a real Search response,
 * write the mapper against it, then implement searchFlights/priceOffer. That
 * is also where Travelport's fare-type modifiers (published / private /
 * net-consolidator) and per-airline account codes get wired in - the levers
 * for the agency's ethnic fares - so FlightOffer.fare can be populated.
 */
@Injectable()
export class TravelportClient implements GdsClient {
  searchFlights(_params: SearchFlightsParams): Promise<FlightOffer[]> {
    return Promise.reject(
      new GdsNotImplementedError(
        'searchFlights',
        'the Travelport response-mapping step (needs a real response sample)',
      ),
    );
  }

  priceOffer(_offerId: string): Promise<PricedOffer> {
    return Promise.reject(
      new GdsNotImplementedError(
        'priceOffer',
        'the Travelport response-mapping step (needs a real response sample)',
      ),
    );
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
}
