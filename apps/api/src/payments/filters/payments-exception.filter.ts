import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import Stripe from 'stripe';

/**
 * Mirrors AmadeusExceptionFilter: never forward a raw Stripe error object to
 * the client. StripeCardError is the one exception - Stripe writes those
 * messages ("Your card was declined.") specifically for end-user display and
 * they contain no account/credential detail, so they're safe to pass through
 * as-is. Every other Stripe error (bad API key, rate limit, connectivity)
 * gets a generic message; full detail still goes to the server log.
 */
@Catch(Stripe.errors.StripeError)
export class PaymentsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PaymentsExceptionFilter.name);

  catch(exception: Stripe.errors.StripeError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { status, message } = this.toHttpResponse(exception);

    this.logger.error(exception.message, exception.stack);

    response.status(status).json({ statusCode: status, message });
  }

  private toHttpResponse(exception: Stripe.errors.StripeError): {
    status: number;
    message: string;
  } {
    if (exception instanceof Stripe.errors.StripeCardError) {
      return {
        status: HttpStatus.PAYMENT_REQUIRED,
        message: exception.message,
      };
    }

    return {
      status: HttpStatus.SERVICE_UNAVAILABLE,
      message:
        'Payment could not be processed right now. Please try again shortly.',
    };
  }
}
