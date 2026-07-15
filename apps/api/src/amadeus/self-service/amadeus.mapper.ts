import { FlightOffer, FlightSegment } from '../interfaces/gds-client.interface';
import {
  AmadeusRawFlightOffer,
  AmadeusRawSegment,
} from './amadeus-response.types';

function toFlightSegment(raw: AmadeusRawSegment): FlightSegment {
  return {
    departure: {
      iataCode: raw.departure.iataCode,
      terminal: raw.departure.terminal,
      at: raw.departure.at,
    },
    arrival: {
      iataCode: raw.arrival.iataCode,
      terminal: raw.arrival.terminal,
      at: raw.arrival.at,
    },
    carrierCode: raw.carrierCode,
    flightNumber: raw.number,
    aircraftCode: raw.aircraft?.code,
    duration: raw.duration,
    numberOfStops: raw.numberOfStops ?? 0,
  };
}

/** Normalizes a raw Amadeus flight-offer into this module's GDS-agnostic shape. */
export function toFlightOffer(
  raw: AmadeusRawFlightOffer,
  id: string,
): FlightOffer {
  return {
    id,
    contentSource: raw.source,
    itineraries: raw.itineraries.map((itinerary) => ({
      duration: itinerary.duration,
      segments: itinerary.segments.map(toFlightSegment),
    })),
    price: {
      currency: raw.price.currency,
      total: raw.price.total,
      base: raw.price.base,
      fees: raw.price.fees,
    },
    numberOfBookableSeats: raw.numberOfBookableSeats,
    validatingAirlineCodes: raw.validatingAirlineCodes ?? [],
    lastTicketingDate: raw.lastTicketingDate,
  };
}
