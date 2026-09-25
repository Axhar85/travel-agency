import { parseEnabledProviders } from './enabled-providers';

describe('parseEnabledProviders', () => {
  it('parses a single provider', () => {
    expect(parseEnabledProviders('amadeus')).toEqual(['amadeus']);
  });

  it('preserves the configured order (it is the merge order)', () => {
    expect(parseEnabledProviders('travelport,amadeus')).toEqual([
      'travelport',
      'amadeus',
    ]);
  });

  it('tolerates whitespace, casing and duplicates', () => {
    expect(parseEnabledProviders(' Amadeus , TRAVELPORT,amadeus ')).toEqual([
      'amadeus',
      'travelport',
    ]);
  });

  it('rejects an unknown provider with a message naming it', () => {
    expect(() => parseEnabledProviders('amadeus,sabre')).toThrow(/sabre/);
  });

  it('rejects an empty list instead of silently searching nothing', () => {
    expect(() => parseEnabledProviders('')).toThrow(/at least one provider/);
    expect(() => parseEnabledProviders(' , ')).toThrow(/at least one provider/);
  });
});
