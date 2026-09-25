import { FlightOffer } from './interfaces/gds-client.interface';

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

/**
 * Compares two non-negative decimal strings without float math. Returns
 * undefined when either isn't a plain decimal, so callers can refuse to
 * decide rather than guess.
 */
export function compareDecimalStrings(
  a: string,
  b: string,
): number | undefined {
  if (!DECIMAL_PATTERN.test(a) || !DECIMAL_PATTERN.test(b)) return undefined;

  const [aInt, aFrac = ''] = a.split('.');
  const [bInt, bFrac = ''] = b.split('.');
  const intDiff = BigInt(aInt) - BigInt(bInt);
  if (intDiff !== 0n) return intDiff > 0n ? 1 : -1;

  const width = Math.max(aFrac.length, bFrac.length);
  const aPadded = aFrac.padEnd(width, '0');
  const bPadded = bFrac.padEnd(width, '0');
  if (aPadded === bPadded) return 0;
  return aPadded > bPadded ? 1 : -1;
}

function flightSignature(offer: FlightOffer): string {
  return offer.itineraries
    .map((itinerary) =>
      itinerary.segments
        .map(
          (segment) =>
            `${segment.carrierCode}${segment.flightNumber}@${segment.departure.at}`,
        )
        .join('>'),
    )
    .join('|');
}

/**
 * Two offers are "the same product" only when they cover the same flights
 * AND carry the same *known* fare classification (type + fare basis codes).
 * Returns null - never merge - when either piece is unknown.
 *
 * This is deliberate for the agency's ethnic/negotiated fares: a private fare
 * can carry eligibility and ticketing conditions a published fare on the same
 * flights doesn't, so it must never be hidden behind (or replace) a published
 * one just because the flights match. Until a provider's mapper can classify
 * its fares, showing a possible duplicate is safer than silently dropping a
 * fare whose rules we can't compare.
 */
function dedupeKey(offer: FlightOffer): string | null {
  if (!offer.fare) return null;
  const flights = flightSignature(offer);
  if (flights.length === 0) return null;
  const basis = [...offer.fare.basisCodes].sort().join(',');
  return `${flights}#${offer.fare.type}#${basis}#${offer.price.currency}`;
}

/**
 * Collapses offers for the same flights + same known fare product (possibly
 * from different providers) down to the cheapest one. Offers in different
 * currencies never share a key, so nothing is ever compared across
 * currencies without an FX rate. First-seen order is preserved.
 */
export function dedupeOffers(offers: FlightOffer[]): FlightOffer[] {
  const result: FlightOffer[] = [];
  const indexByKey = new Map<string, number>();

  for (const offer of offers) {
    const key = dedupeKey(offer);
    if (key === null) {
      result.push(offer);
      continue;
    }

    const existingIndex = indexByKey.get(key);
    if (existingIndex === undefined) {
      indexByKey.set(key, result.length);
      result.push(offer);
      continue;
    }

    const comparison = compareDecimalStrings(
      offer.price.total,
      result[existingIndex].price.total,
    );
    if (comparison !== undefined && comparison < 0) {
      result[existingIndex] = offer;
    }
  }

  return result;
}
