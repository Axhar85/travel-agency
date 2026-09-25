// Provider-neutral domain errors. Each provider module (amadeus/, travelport/)
// throws its own thin subclass so logs say which GDS failed, but everything
// outside those modules - the aggregator and GdsExceptionFilter - only ever
// deals with these base classes, so raw axios/GDS error shapes never leak.

export class GdsAuthError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    readonly provider?: string,
  ) {
    super(message);
    this.name = 'GdsAuthError';
  }
}

export class GdsApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly cause?: unknown,
    readonly provider?: string,
  ) {
    super(message);
    this.name = 'GdsApiError';
  }
}

/** Thrown by priceOffer()/createOrder() when a cached offer has expired, was never cached, or belongs to a provider that isn't enabled. */
export class OfferExpiredError extends Error {
  constructor(readonly offerId: string) {
    super(`Offer ${offerId} has expired or was not found — search again`);
    this.name = 'OfferExpiredError';
  }
}

export class GdsNotImplementedError extends Error {
  constructor(method: string, phase: string) {
    super(`${method}() is not implemented yet — arrives in ${phase}`);
    this.name = 'GdsNotImplementedError';
  }
}
