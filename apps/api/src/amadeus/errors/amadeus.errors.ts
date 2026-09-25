import { GdsApiError, GdsAuthError } from '../../gds/errors/gds.errors';

// OfferExpiredError and GdsNotImplementedError are provider-neutral and now
// live in gds/errors - re-exported here so existing imports keep working.
export {
  GdsNotImplementedError,
  OfferExpiredError,
} from '../../gds/errors/gds.errors';

export class AmadeusAuthError extends GdsAuthError {
  constructor(message: string, cause?: unknown) {
    super(message, cause, 'amadeus');
    this.name = 'AmadeusAuthError';
  }
}

export class AmadeusApiError extends GdsApiError {
  constructor(message: string, statusCode?: number, cause?: unknown) {
    super(message, statusCode, cause, 'amadeus');
    this.name = 'AmadeusApiError';
  }
}
