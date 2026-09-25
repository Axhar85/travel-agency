import { compareDecimalStrings, dedupeOffers } from './dedupe-offers';
import {
  FareClassification,
  FlightOffer,
  GdsProviderName,
} from './interfaces/gds-client.interface';

function buildOffer(
  overrides: {
    id?: string;
    provider?: GdsProviderName;
    total?: string;
    currency?: string;
    flight?: string;
    fare?: FareClassification | null;
  } = {},
): FlightOffer {
  const {
    id = 'o1',
    provider = 'amadeus',
    total = '500.00',
    currency = 'EUR',
    flight = '100',
    fare = { type: 'PUBLISHED', basisCodes: ['YLOW'] },
  } = overrides;

  return {
    id,
    provider,
    contentSource: 'GDS',
    itineraries: [
      {
        duration: 'PT10H',
        segments: [
          {
            departure: { iataCode: 'MAD', at: '2026-10-01T10:00:00' },
            arrival: { iataCode: 'LHE', at: '2026-10-01T20:00:00' },
            carrierCode: 'PK',
            flightNumber: flight,
            duration: 'PT10H',
            numberOfStops: 0,
          },
        ],
      },
    ],
    price: { currency, total, base: total },
    ...(fare ? { fare } : {}),
    validatingAirlineCodes: ['PK'],
  };
}

describe('compareDecimalStrings', () => {
  it('compares without float math, across differing precision', () => {
    expect(compareDecimalStrings('199.99', '200.00')).toBe(-1);
    expect(compareDecimalStrings('200', '200.00')).toBe(0);
    expect(compareDecimalStrings('1000.5', '999.99')).toBe(1);
    expect(compareDecimalStrings('0.1', '0.10')).toBe(0);
  });

  it('refuses to compare non-decimal input', () => {
    expect(compareDecimalStrings('abc', '1.00')).toBeUndefined();
    expect(compareDecimalStrings('1,00', '1.00')).toBeUndefined();
  });
});

describe('dedupeOffers', () => {
  it('keeps the cheaper of the same flights + same known fare from two providers', () => {
    const amadeus = buildOffer({
      id: 'a',
      provider: 'amadeus',
      total: '520.00',
    });
    const travelport = buildOffer({
      id: 't',
      provider: 'travelport',
      total: '499.50',
    });

    const result = dedupeOffers([amadeus, travelport]);

    expect(result).toEqual([travelport]);
  });

  it('keeps the first offer when prices are equal', () => {
    const first = buildOffer({ id: 'a', provider: 'amadeus' });
    const second = buildOffer({ id: 't', provider: 'travelport' });

    expect(dedupeOffers([first, second])).toEqual([first]);
  });

  it('never merges a private (e.g. ethnic) fare with a published fare on the same flights', () => {
    const published = buildOffer({ id: 'pub', total: '520.00' });
    const privateFare = buildOffer({
      id: 'priv',
      provider: 'travelport',
      total: '410.00',
      fare: { type: 'PRIVATE', basisCodes: ['YLOW'] },
    });

    const result = dedupeOffers([published, privateFare]);

    expect(result).toEqual([published, privateFare]);
  });

  it('never merges fares with different fare basis codes', () => {
    const a = buildOffer({
      id: 'a',
      fare: { type: 'PUBLISHED', basisCodes: ['YLOW'] },
    });
    const b = buildOffer({
      id: 'b',
      provider: 'travelport',
      total: '300.00',
      fare: { type: 'PUBLISHED', basisCodes: ['YFLEX'] },
    });

    expect(dedupeOffers([a, b])).toEqual([a, b]);
  });

  it('never merges an offer whose fare is unclassified, in either direction', () => {
    const classified = buildOffer({ id: 'a' });
    const unclassified = buildOffer({
      id: 'b',
      provider: 'travelport',
      fare: null,
    });

    expect(dedupeOffers([classified, unclassified])).toEqual([
      classified,
      unclassified,
    ]);
    expect(dedupeOffers([unclassified, classified])).toEqual([
      unclassified,
      classified,
    ]);
  });

  it('never compares prices across currencies', () => {
    const eur = buildOffer({ id: 'a', currency: 'EUR', total: '500.00' });
    const usd = buildOffer({
      id: 'b',
      provider: 'travelport',
      currency: 'USD',
      total: '100.00',
    });

    expect(dedupeOffers([eur, usd])).toEqual([eur, usd]);
  });

  it('keeps different flights separate', () => {
    const a = buildOffer({ id: 'a', flight: '100' });
    const b = buildOffer({ id: 'b', flight: '200', provider: 'travelport' });

    expect(dedupeOffers([a, b])).toEqual([a, b]);
  });

  it('preserves first-seen order when a later, cheaper duplicate replaces an earlier one', () => {
    const other = buildOffer({ id: 'other', flight: '200' });
    const dupA = buildOffer({ id: 'dupA', total: '520.00' });
    const dupB = buildOffer({
      id: 'dupB',
      provider: 'travelport',
      total: '480.00',
    });

    const result = dedupeOffers([dupA, other, dupB]);

    expect(result.map((offer) => offer.id)).toEqual(['dupB', 'other']);
  });
});
