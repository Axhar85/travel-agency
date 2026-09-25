import { GdsProviderName } from './interfaces/gds-client.interface';
import { GDS_PROVIDER_NAMES } from './offer-id';

/**
 * Parses the GDS_PROVIDERS env var (e.g. "amadeus,travelport") into the
 * ordered list of providers to search. Throws a readable message on an
 * unknown name or an empty list, so a typo fails at boot instead of silently
 * searching nothing. Order is preserved - it's the order results are merged in.
 */
export function parseEnabledProviders(raw: string): GdsProviderName[] {
  const names = raw
    .split(',')
    .map((name) => name.trim().toLowerCase())
    .filter((name) => name.length > 0);

  if (names.length === 0) {
    throw new Error(
      `GDS_PROVIDERS must list at least one provider (${GDS_PROVIDER_NAMES.join(', ')})`,
    );
  }

  const unknown = names.filter(
    (name) => !(GDS_PROVIDER_NAMES as readonly string[]).includes(name),
  );
  if (unknown.length > 0) {
    throw new Error(
      `GDS_PROVIDERS contains unknown provider(s): ${unknown.join(', ')} (known: ${GDS_PROVIDER_NAMES.join(', ')})`,
    );
  }

  return [...new Set(names)] as GdsProviderName[];
}
