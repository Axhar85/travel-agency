import { GdsProviderName } from './interfaces/gds-client.interface';

/** Every provider this app knows about, whether or not it's enabled at runtime. */
export const GDS_PROVIDER_NAMES: readonly GdsProviderName[] = [
  'amadeus',
  'travelport',
];

/**
 * Offers/orders that predate multi-provider support carry no prefix. They were
 * all created by Amadeus, so an unprefixed id keeps routing there - this keeps
 * an in-flight booking session or cached search result from breaking across
 * the deploy that introduced prefixes.
 */
const LEGACY_PROVIDER: GdsProviderName = 'amadeus';

const UUID_PATTERN =
  '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';

/** `<provider>.<uuid>`, or a bare uuid for legacy Amadeus offers. */
export const OFFER_ID_PATTERN = new RegExp(
  `^(?:(?:${GDS_PROVIDER_NAMES.join('|')})\\.)?${UUID_PATTERN}$`,
  'i',
);

function isProviderName(value: string): value is GdsProviderName {
  return (GDS_PROVIDER_NAMES as readonly string[]).includes(value);
}

/**
 * The customer-facing id of an offer/order is `<provider>.<native id>` so the
 * aggregator can send priceOffer/createOrder/... back to whichever GDS
 * actually issued it. Provider clients only ever see their own native id.
 */
export function encodeOfferId(
  provider: GdsProviderName,
  nativeId: string,
): string {
  return `${provider}.${nativeId}`;
}

export function decodeOfferId(id: string): {
  provider: GdsProviderName;
  nativeId: string;
} {
  const dot = id.indexOf('.');
  if (dot > 0) {
    const prefix = id.slice(0, dot);
    if (isProviderName(prefix)) {
      return { provider: prefix, nativeId: id.slice(dot + 1) };
    }
  }
  return { provider: LEGACY_PROVIDER, nativeId: id };
}
