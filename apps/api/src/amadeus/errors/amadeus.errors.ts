export class AmadeusAuthError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AmadeusAuthError';
  }
}

export class AmadeusApiError extends Error {
  constructor(
    message: string,
    readonly statusCode?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AmadeusApiError';
  }
}

/** Thrown by priceOffer()/createOrder() when a cached offer has expired or was never cached. */
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
