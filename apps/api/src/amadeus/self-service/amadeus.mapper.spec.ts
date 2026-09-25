import { AmadeusRawFlightOffer } from './amadeus-response.types';
import { toFlightOffer } from './amadeus.mapper';

const baseRaw: AmadeusRawFlightOffer = {
  id: '1',
  source: 'GDS',
  itineraries: [
    {
      duration: 'PT10H',
      segments: [
        {
          departure: { iataCode: 'MAD', at: '2026-10-01T10:00:00' },
          arrival: { iataCode: 'LHE', at: '2026-10-01T20:00:00' },
          carrierCode: 'PK',
          number: '100',
          duration: 'PT10H',
        },
      ],
    },
  ],
  price: { currency: 'EUR', total: '500.00', base: '400.00' },
};

describe('toFlightOffer', () => {
  it('stamps the amadeus provider on every offer', () => {
    expect(toFlightOffer(baseRaw, 'native-id').provider).toBe('amadeus');
    expect(toFlightOffer(baseRaw, 'native-id').id).toBe('native-id');
  });

  it('leaves the fare unclassified when Amadeus did not say what kind it is', () => {
    expect(toFlightOffer(baseRaw, 'id').fare).toBeUndefined();
    expect(
      toFlightOffer({ ...baseRaw, pricingOptions: { fareType: [] } }, 'id')
        .fare,
    ).toBeUndefined();
  });

  it('classifies PUBLISHED fares and collects distinct fare basis codes', () => {
    const offer = toFlightOffer(
      {
        ...baseRaw,
        pricingOptions: { fareType: ['PUBLISHED'] },
        travelerPricings: [
          {
            fareDetailsBySegment: [
              { fareBasis: 'YLOW' },
              { fareBasis: 'YLOW' },
            ],
          },
          { fareDetailsBySegment: [{ fareBasis: 'YFLEX' }, {}] },
        ],
      },
      'id',
    );

    expect(offer.fare).toEqual({
      type: 'PUBLISHED',
      basisCodes: ['YLOW', 'YFLEX'],
    });
  });

  it('classifies any non-PUBLISHED fare type as PRIVATE', () => {
    expect(
      toFlightOffer(
        { ...baseRaw, pricingOptions: { fareType: ['NEGOTIATED'] } },
        'id',
      ).fare?.type,
    ).toBe('PRIVATE');
    expect(
      toFlightOffer(
        {
          ...baseRaw,
          pricingOptions: { fareType: ['PUBLISHED', 'CORPORATE'] },
        },
        'id',
      ).fare?.type,
    ).toBe('PRIVATE');
  });
});
