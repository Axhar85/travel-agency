import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  AmadeusApiError,
  AmadeusAuthError,
  GdsNotImplementedError,
  OfferExpiredError,
} from '../errors/amadeus.errors';

type AmadeusDomainError =
  | AmadeusAuthError
  | AmadeusApiError
  | OfferExpiredError
  | GdsNotImplementedError;

/**
 * Translates AmadeusModule's domain errors into safe HTTP responses.
 * Never forwards the raw upstream error/cause to the client — that's where
 * Amadeus response bodies, stack traces, or credential-adjacent detail could
 * leak. Full detail still goes to the server log.
 */
@Catch(
  AmadeusAuthError,
  AmadeusApiError,
  OfferExpiredError,
  GdsNotImplementedError,
)
export class AmadeusExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AmadeusExceptionFilter.name);

  catch(exception: AmadeusDomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { status, message } = this.toHttpResponse(exception);

    this.logger.error(exception.message, exception.stack);

    response.status(status).json({
      statusCode: status,
      message,
    });
  }

  private toHttpResponse(exception: AmadeusDomainError): {
    status: number;
    message: string;
  } {
    if (exception instanceof OfferExpiredError) {
      return {
        status: HttpStatus.GONE,
        message: 'This offer has expired — please search again.',
      };
    }

    if (exception instanceof AmadeusAuthError) {
      // Also reachable from BookingService's priceOffer() call, not just
      // search - kept generic rather than saying "search" specifically.
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        message:
          'This service is temporarily unavailable. Please try again shortly.',
      };
    }

    if (exception instanceof AmadeusApiError) {
      // This filter is global, not search-only - AmadeusApiError also
      // surfaces from BookingService's priceOffer() call, so the message
      // can't be phrased as if it's always about a search.
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
