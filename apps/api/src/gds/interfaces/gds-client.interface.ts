// Domain types returned by GdsClient are normalized shapes owned by the gds/
// module — never a passthrough of any provider's raw JSON/XML. Every provider
// (Amadeus Self-Service today, Amadeus Enterprise and Travelport/Galileo
// next) must map its own response into these same shapes, so nothing outside
// that provider's own module has to change. See CLAUDE.md "Amadeus swap plan".

/** The GDS/content providers this app can search and book through. */
export type GdsProviderName = 'amadeus' | 'travelport';

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
 * PUBLISHED = publicly filed fare. PRIVATE = anything negotiated, net/
 * consolidator, or otherwise not publicly filed - this is where the agency's
 * "ethnic"/community fares for specific airlines and destinations fall. The
 * distinction is a real business rule (eligibility, markup, who may ticket
 * it), so it travels with the offer instead of being flattened away.
 */
export type FareType = 'PUBLISHED' | 'PRIVATE';

export interface FareClassification {
  type: FareType;
  /** Distinct fare basis codes (e.g. "YLOWPK") across the priced segments. */
  basisCodes: string[];
}

/**
 * `contentSource` reflects whether this offer is GDS, NDC, or LCC content —
 * a real business distinction (drives post-booking servicing limits, see
 * CLAUDE.md re: Self-Service Flight Create Orders), not a REST-shape leak.
 *
 * `provider` is which GDS returned the offer; providers set it themselves
 * when they map a response. `fare` is only present when the provider could
 * classify the fare - absent means "unknown", never "published".
 */
export interface FlightOffer {
  id: string;
  provider: GdsProviderName;
  contentSource: string;
  itineraries: FlightItinerary[];
  price: FarePrice;
  fare?: FareClassification;
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
 * GDS-agnostic contract. Nothing outside a provider's own module may depend
 * on implementation details of that provider - callers go through GdsService,
 * which routes each call to the provider that owns the offer/order id.
 */
export interface GdsClient {
  searchFlights(params: SearchFlightsParams): Promise<FlightOffer[]>;
  priceOffer(offerId: string): Promise<PricedOffer>;
  createOrder(offerId: string, passengers: Passenger[]): Promise<GdsOrder>;
  issueTicket(orderId: string): Promise<GdsOrder>;
  getOrder(orderId: string): Promise<GdsOrder>;
}

/** A GdsClient registered with the aggregator under its provider name. */
export interface GdsProviderEntry {
  name: GdsProviderName;
  client: GdsClient;
}
