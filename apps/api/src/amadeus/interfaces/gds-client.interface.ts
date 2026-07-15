// Domain types returned by GdsClient are normalized shapes owned by this
// module — never a passthrough of Amadeus REST JSON. When the Enterprise/SOAP
// implementation lands, it must produce these same shapes so nothing outside
// AmadeusModule has to change. See CLAUDE.md "Amadeus swap plan".

export interface SearchFlightsParams {
  originLocationCode: string;
  destinationLocationCode: string;
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
  nonStop?: boolean;
  currencyCode?: string;
  maxResults?: number;
}

export interface FlightEndpoint {
  iataCode: string;
  terminal?: string;
  at: string; // ISO 8601 datetime
}

export interface FlightSegment {
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  carrierCode: string;
  flightNumber: string;
  aircraftCode?: string;
  duration: string; // ISO 8601 duration, e.g. PT2H30M
  numberOfStops: number;
}

export interface FlightItinerary {
  duration: string;
  segments: FlightSegment[];
}

export interface FareFee {
  amount: string;
  type: string;
}

export interface FarePrice {
  currency: string;
  total: string;
  base: string;
  fees?: FareFee[];
}

/**
 * `contentSource` reflects whether this offer is GDS, NDC, or LCC content —
 * a real business distinction (drives post-booking servicing limits, see
 * CLAUDE.md re: Self-Service Flight Create Orders), not a REST-shape leak.
 */
export interface FlightOffer {
  id: string;
  contentSource: string;
  itineraries: FlightItinerary[];
  price: FarePrice;
  numberOfBookableSeats?: number;
  validatingAirlineCodes: string[];
  lastTicketingDate?: string;
}

export interface PricedOffer extends FlightOffer {
  /** True if the confirmed price differs from the price shown at search time. */
  priceChanged: boolean;
  originalTotal: string;
}

export type PassengerType = 'ADULT' | 'CHILD' | 'INFANT';

export interface PassengerDocument {
  documentType: 'PASSPORT';
  number: string;
  expiryDate: string; // YYYY-MM-DD
  issuanceCountry: string; // ISO 3166-1 alpha-2
  nationality: string; // ISO 3166-1 alpha-2
  holder: boolean;
}

export interface Passenger {
  type: PassengerType;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE';
  email?: string;
  phone?: string;
  document?: PassengerDocument;
}

export type OrderStatus = 'CREATED' | 'TICKETED' | 'CANCELLED' | 'FAILED';

export interface GdsOrder {
  id: string;
  status: OrderStatus;
  offer: FlightOffer;
  passengers: Passenger[];
  bookingReference?: string;
  ticketNumbers?: string[];
  createdAt: string;
}

/**
 * GDS-agnostic contract. Nothing outside AmadeusModule may depend on
 * implementation details of whichever GdsClient is bound at runtime.
 */
export interface GdsClient {
  searchFlights(params: SearchFlightsParams): Promise<FlightOffer[]>;
  priceOffer(offerId: string): Promise<PricedOffer>;
  createOrder(offerId: string, passengers: Passenger[]): Promise<GdsOrder>;
  issueTicket(orderId: string): Promise<GdsOrder>;
  getOrder(orderId: string): Promise<GdsOrder>;
}
