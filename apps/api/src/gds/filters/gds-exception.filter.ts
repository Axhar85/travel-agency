import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  GdsApiError,
  GdsAuthError,
  GdsNotImplementedError,
  OfferExpiredError,
} from '../errors/gds.errors';

type GdsDomainError =
  GdsAuthError | GdsApiError | OfferExpiredError | GdsNotImplementedError;

/**
 * Translates GDS domain errors (from any provider - Amadeus, Travelport, ...)
 * into safe HTTP responses. Never forwards the raw upstream error/cause to
 * the client — that's where GDS response bodies, stack traces, or
 * credential-adjacent detail could leak. Full detail still goes to the
 * server log.
 */
@Catch(GdsAuthError, GdsApiError, OfferExpiredError, GdsNotImplementedError)
export class GdsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GdsExceptionFilter.name);

  catch(exception: GdsDomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { status, message } = this.toHttpResponse(exception);

    this.logger.error(exception.message, exception.stack);

    response.status(status).json({
      statusCode: status,
      message,
    });
  }

  private toHttpResponse(exception: GdsDomainError): {
    status: number;
    message: string;
  } {
    if (exception instanceof OfferExpiredError) {
      return {
        status: HttpStatus.GONE,
        message: 'This offer has expired — please search again.',
      };
    }

    if (exception instanceof GdsAuthError) {
      // Also reachable from BookingService's priceOffer() call, not just
      // search - kept generic rather than saying "search" specifically.
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'This service is temporarily unavailable. Please try again shortly.',
      };
    }

    if (exception instanceof GdsApiError) {
      // This filter is global, not search-only - GdsApiError also surfaces
      // from BookingService's priceOffer() call, so the message can't be
      // phrased as if it's always about a search.
      if (exception.statusCode === HttpStatus.TOO_MANY_REQUESTS) {
        // Distinct from a genuinely invalid request - the client did
        // nothing wrong here, retrying shortly is the correct action.
        return {
          status: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Too many requests right now. Please wait a moment and try again.',
        };
      }
      if (
        exception.statusCode &&
        exception.statusCode >= 400 &&
        exception.statusCode < 500
      ) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid request — please check the details and try again.',
        };
      }
      return {
        status: HttpStatus.BAD_GATEWAY,
        message:
          'This service is temporarily unavailable. Please try again shortly.',
      };
    }

    // GdsNotImplementedError
    return {
      status: HttpStatus.NOT_IMPLEMENTED,
      message: 'This action is not available yet.',
    };
  }
}
