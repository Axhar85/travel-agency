// Shapes of Amadeus Self-Service REST responses. These types are private to
// this file/mapper — nothing outside `self-service/` may import them.

export interface AmadeusRawEndpoint {
  iataCode: string;
  terminal?: string;
  at: string;
}

export interface AmadeusRawSegment {
  departure: AmadeusRawEndpoint;
  arrival: AmadeusRawEndpoint;
  carrierCode: string;
  number: string;
  aircraft?: { code: string };
  duration: string;
  numberOfStops?: number;
}

export interface AmadeusRawItinerary {
  duration: string;
  segments: AmadeusRawSegment[];
}

export interface AmadeusRawFee {
  amount: string;
  type: string;
}

export interface AmadeusRawPrice {
  currency: string;
  total: string;
  base: string;
  fees?: AmadeusRawFee[];
}

export interface AmadeusRawFlightOffer {
  id: string;
  source: string;
  itineraries: AmadeusRawItinerary[];
  price: AmadeusRawPrice;
  numberOfBookableSeats?: number;
  validatingAirlineCodes?: string[];
  lastTicketingDate?: string;
}

export interface AmadeusFlightOffersSearchResponse {
  data: AmadeusRawFlightOffer[];
}

export interface AmadeusFlightOffersPricingResponse {
  data: {
    flightOffers: AmadeusRawFlightOffer[];
  };
}
