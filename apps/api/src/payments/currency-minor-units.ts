// Stripe amounts are integers in the currency's smallest unit. Most ISO 4217
// currencies use 2 decimal places (cents) but this is not universal - e.g.
// JPY has none, KWD/BHD/OMR have 3. Getting this wrong silently over- or
// under-charges by a factor of 10/100/1000, so it's a real payment bug, not
// a cosmetic one. Table only needs currencies plausible for an IATA agency
// selling in EUR-denominated fares with occasional non-EUR pricing.
const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);

const THREE_DECIMAL_CURRENCIES = new Set(['BHD', 'JOD', 'KWD', 'OMR', 'TND']);

function decimalPlacesFor(currency: string): number {
  const code = currency.toUpperCase();
  if (ZERO_DECIMAL_CURRENCIES.has(code)) return 0;
  if (THREE_DECIMAL_CURRENCIES.has(code)) return 3;
  return 2;
}

/**
 * Converts a decimal amount string (e.g. "450.00", as returned by Amadeus
 * fare pricing) into Stripe's minor-unit integer for the given currency.
 * Parses digit-by-digit rather than via float math to avoid binary
 * floating-point rounding on money values.
 */
export function toStripeMinorUnits(amount: string, currency: string): number {
  const places = decimalPlacesFor(currency);
  const [whole, fraction = ''] = amount.split('.');
  const paddedFraction = (fraction + '0'.repeat(places)).slice(0, places);
  const digits = `${whole}${paddedFraction}`;
  const value = Number.parseInt(digits, 10);
  if (!Number.isFinite(value) || Number.isNaN(value)) {
    throw new Error(`Cannot convert amount "${amount}" to minor units`);
  }
  return value;
}
