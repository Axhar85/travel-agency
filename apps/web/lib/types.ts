// Mirrors the normalized shapes returned by apps/api's AmadeusModule
// (apps/api/src/amadeus/interfaces/gds-client.interface.ts) and SearchModule.
// The frontend and backend are separate apps with no shared package (yet),
// so these are kept in sync by hand — small surface area for now.

export type CabinClass = "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";

export interface FlightEndpoint {
  iataCode: string;
  terminal?: string;
  at: string;
}

export interface FlightSegment {
  departure: FlightEndpoint;
  arrival: FlightEndpoint;
  carrierCode: string;
  flightNumber: string;
  aircraftCode?: string;
  duration: string;
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
  priceChanged: boolean;
  originalTotal: string;
}

export interface SearchFlightsResponse {
  offers: FlightOffer[];
  cached: boolean;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
}
