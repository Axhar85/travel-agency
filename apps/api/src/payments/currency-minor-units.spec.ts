import { toStripeMinorUnits } from './currency-minor-units';

describe('toStripeMinorUnits', () => {
  it('converts a standard 2-decimal currency amount to cents', () => {
    expect(toStripeMinorUnits('450.00', 'EUR')).toBe(45_000);
    expect(toStripeMinorUnits('19.99', 'USD')).toBe(1_999);
  });

  it('handles amounts with no fractional part', () => {
    expect(toStripeMinorUnits('100', 'EUR')).toBe(10_000);
  });

  it('handles a short fractional part by padding', () => {
    expect(toStripeMinorUnits('10.5', 'EUR')).toBe(1_050);
  });

  it('treats zero-decimal currencies as whole units (no multiplication)', () => {
    expect(toStripeMinorUnits('1500', 'JPY')).toBe(1500);
  });

  it('treats 3-decimal currencies correctly (e.g. KWD)', () => {
    expect(toStripeMinorUnits('120.500', 'KWD')).toBe(120_500);
  });

  it('is case-insensitive on the currency code', () => {
    expect(toStripeMinorUnits('10.00', 'eur')).toBe(1_000);
  });

  it('throws on a non-numeric amount rather than silently returning NaN', () => {
    expect(() => toStripeMinorUnits('not-a-number', 'EUR')).toThrow();
  });
});
