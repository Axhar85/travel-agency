import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

enum AmadeusMode {
  SelfService = 'self-service',
  Enterprise = 'enterprise',
}

class EnvironmentVariables {
  @IsIn(['development', 'test', 'production'])
  @IsOptional()
  NODE_ENV: string = 'development';

  @IsInt()
  @Min(1)
  @Max(65535)
  @IsOptional()
  PORT: number = 4000;

  @IsString()
  CORS_ORIGIN: string;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  REDIS_URL: string;

  @IsIn([AmadeusMode.SelfService, AmadeusMode.Enterprise])
  AMADEUS_MODE: AmadeusMode;

  // Amadeus/Stripe secrets are intentionally allowed to be empty strings at
  // boot (sandbox onboarding may lag app setup) — AmadeusModule and the
  // payments module fail loudly at call time instead, so the app can still
  // start and serve health/search-UI routes during local setup.
  @IsString()
  @IsOptional()
  AMADEUS_CLIENT_ID: string = '';

  @IsString()
  @IsOptional()
  AMADEUS_CLIENT_SECRET: string = '';

  @IsUrl({ require_tld: false })
  AMADEUS_API_BASE_URL: string;

  // How long a single raw Amadeus offer stays cached in Redis so
  // priceOffer(offerId) can look it up (Self-Service is stateless).
  @IsInt()
  @Min(1)
  @IsOptional()
  AMADEUS_OFFER_CACHE_TTL_SECONDS: number = 900;

  // How long a full search response (list of offers) stays cached in Redis,
  // keyed by normalized search params. Shorter than the offer TTL above
  // since fares are volatile and a stale offer id is a poor cache hit.
  @IsInt()
  @Min(1)
  @IsOptional()
  SEARCH_RESULTS_CACHE_TTL_SECONDS: number = 300;

  @IsString()
  @IsOptional()
  STRIPE_SECRET_KEY: string = '';

  @IsString()
  @IsOptional()
  STRIPE_PUBLISHABLE_KEY: string = '';

  @IsString()
  @IsOptional()
  STRIPE_WEBHOOK_SECRET: string = '';

  // How long a payment's own Redis record survives - independent of the
  // booking session TTL, since it's keyed by Stripe PaymentIntent id (not
  // session id) and is written to by the webhook with no session in play.
  // Comfortably longer than Stripe's own 7-day auto-cancellation window for
  // uncaptured manual-capture PaymentIntents.
  @IsInt()
  @Min(60)
  @IsOptional()
  PAYMENT_RECORD_TTL_SECONDS: number = 691_200; // 8 days

  // bcrypt hash of the admin panel password - never a plaintext password.
  // Generate via `npm run admin:hash-password -- "your-password"`. Empty at
  // boot is allowed (same pattern as Amadeus/Stripe secrets) - login simply
  // always fails until it's set, rather than blocking the app from starting.
  @IsString()
  @IsOptional()
  ADMIN_PASSWORD_HASH: string = '';

  // Image storage for owner-uploaded promotion posters. Empty at boot is
  // allowed - only the upload endpoint fails until it's set.
  @IsString()
  @IsOptional()
  BLOB_READ_WRITE_TOKEN: string = '';

  // Signs the booking-session cookie. Unlike Amadeus/Stripe secrets above,
  // this is exercised on every request once session middleware is wired up,
  // so it has no silent empty-string fallback — a missing/weak value here
  // would be a real security hole, not just a broken integration.
  @IsString()
  SESSION_SECRET: string;

  // How long an abandoned booking-in-progress (priced offer + passenger
  // details entered so far) survives in Redis before the session expires.
  @IsInt()
  @Min(60)
  @IsOptional()
  BOOKING_SESSION_TTL_SECONDS: number = 1800;

  // How long a logged-in customer's session survives - deliberately much
  // longer than BOOKING_SESSION_TTL_SECONDS above. Set on session.cookie.maxAge
  // at login/register time (see AccountService); guest/admin sessions never
  // touch this and keep the short default.
  @IsInt()
  @Min(60)
  @IsOptional()
  ACCOUNT_SESSION_TTL_SECONDS: number = 2_592_000; // 30 days
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${messages}`);
  }

  // Two independent Redis caches sit on top of each other: SearchService
  // caches full search responses (which embed offer ids), OfferCacheService
  // caches the raw offers those ids point to. If the search-response TTL
  // ever outlived the offer TTL, a "fresh-looking" cached search result
  // could reference an offer id that's already expired, turning a normal
  // priceOffer() call into a confusing OfferExpiredError. Not expressible
  // as a single-field class-validator decorator, so it's checked here.
  if (
    validated.SEARCH_RESULTS_CACHE_TTL_SECONDS >
    validated.AMADEUS_OFFER_CACHE_TTL_SECONDS
  ) {
    throw new Error(
      `Invalid environment configuration: SEARCH_RESULTS_CACHE_TTL_SECONDS (${validated.SEARCH_RESULTS_CACHE_TTL_SECONDS}) must not be greater than AMADEUS_OFFER_CACHE_TTL_SECONDS (${validated.AMADEUS_OFFER_CACHE_TTL_SECONDS}), or cached search results could reference already-expired offer ids.`,
    );
  }

  return validated;
}
