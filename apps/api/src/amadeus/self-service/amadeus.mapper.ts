import {
  FareClassification,
  FlightOffer,
  FlightSegment,
} from '../../gds/interfaces/gds-client.interface';
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

/**
 * Only classifies a fare when Amadeus actually said what kind it is. Every
 * fare type other than PUBLISHED is treated as PRIVATE (negotiated, corporate,
 * consolidator ...) - "not publicly filed" is the property the rest of the app
 * cares about, e.g. so a private fare is never merged into a published one.
 * ASSUMPTION to verify against live Amadeus responses: `pricingOptions.fareType`
 * is an array of type names with PUBLISHED marking public fares.
 */
function toFareClassification(
  raw: AmadeusRawFlightOffer,
): FareClassification | undefined {
  const fareTypes = raw.pricingOptions?.fareType;
  if (!fareTypes || fareTypes.length === 0) return undefined;

  const basisCodes = [
    ...new Set(
      (raw.travelerPricings ?? [])
        .flatMap((pricing) => pricing.fareDetailsBySegment ?? [])
        .map((detail) => detail.fareBasis)
        .filter((basis): basis is string => Boolean(basis)),
    ),
  ];

  return {
    type: fareTypes.every((type) => type === 'PUBLISHED')
      ? 'PUBLISHED'
      : 'PRIVATE',
    basisCodes,
  };
}

/** Normalizes a raw Amadeus flight-offer into the GDS-agnostic shape. */
export function toFlightOffer(
  raw: AmadeusRawFlightOffer,
  id: string,
): FlightOffer {
  return {
    id,
    provider: 'amadeus',
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
    fare: toFareClassification(raw),
    numberOfBookableSeats: raw.numberOfBookableSeats,
    validatingAirlineCodes: raw.validatingAirlineCodes ?? [],
    lastTicketingDate: raw.lastTicketingDate,
  };
}
