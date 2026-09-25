/**
 * Travelport TripServices OAuth token endpoints, per
 * developer.travelport.com/docs/getting-started/authentication. Pre-production
 * is the default everywhere - going to production is an explicit env change
 * (TRAVELPORT_ENV=production) made only once Travelport has provisioned real
 * production credentials.
 */
export const TRAVELPORT_AUTH_URLS = {
  preproduction: 'https://auth.pp.travelport.net/oauth/token',
  production: 'https://auth.travelport.net/oauth/token',
} as const;

export type TravelportEnvironment = keyof typeof TRAVELPORT_AUTH_URLS;
