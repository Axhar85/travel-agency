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

  return validated;
}
