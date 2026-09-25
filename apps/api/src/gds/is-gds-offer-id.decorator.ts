import { Matches, ValidationOptions } from 'class-validator';
import { OFFER_ID_PATTERN } from './offer-id';

/**
 * Validates an offer id as it crosses the HTTP boundary: `<provider>.<uuid>`
 * or a bare legacy uuid. Replaces the plain @IsUUID() the DTOs used while
 * Amadeus was the only provider (a prefixed id is not a UUID).
 */
export function IsGdsOfferId(options?: ValidationOptions): PropertyDecorator {
  return Matches(OFFER_ID_PATTERN, {
    message: 'offerId must be a valid offer id',
    ...options,
  });
}
