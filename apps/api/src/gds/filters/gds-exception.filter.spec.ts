import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import {
  AmadeusApiError,
  AmadeusAuthError,
} from '../../amadeus/errors/amadeus.errors';
import { TravelportAuthError } from '../../travelport/errors/travelport.errors';
import {
  GdsNotImplementedError,
  OfferExpiredError,
} from '../errors/gds.errors';
import { GdsExceptionFilter } from './gds-exception.filter';

function buildHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('GdsExceptionFilter', () => {
  const filter = new GdsExceptionFilter();

  it('maps a Travelport auth failure to 503 the same way as Amadeus (provider-neutral)', () => {
    const { host, status, json } = buildHost();

    filter.catch(
      new TravelportAuthError('bad creds', { password: 'do-not-leak' }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain('do-not-leak');
  });

  it('maps OfferExpiredError to 410 Gone', () => {
    const { host, status, json } = buildHost();

    filter.catch(new OfferExpiredError('offer-1'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.GONE);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: HttpStatus.GONE }),
    );
  });

  it('maps AmadeusAuthError to 503 without leaking credentials/cause', () => {
    const { host, status, json } = buildHost();

    filter.catch(
      new AmadeusAuthError('bad creds', { secret: 'do-not-leak' }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain('do-not-leak');
  });

  it('maps a 4xx AmadeusApiError to 400 Bad Request', () => {
    const { host, status } = buildHost();

    filter.catch(
      new AmadeusApiError('Invalid airport code', 400, { errors: [] }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
  });

  it('maps a 5xx/unknown AmadeusApiError to 502 Bad Gateway', () => {
    const { host, status } = buildHost();

    filter.catch(new AmadeusApiError('Upstream failure', 500), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
  });

  it('maps a 429 AmadeusApiError to 429 Too Many Requests, distinct from a 400', () => {
    const { host, status, json } = buildHost();

    filter.catch(new AmadeusApiError('Rate limited', 429), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.TOO_MANY_REQUESTS);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(body.message).not.toMatch(/invalid/i);
  });

  it('maps GdsNotImplementedError to 501 Not Implemented', () => {
    const { host, status } = buildHost();

    filter.catch(new GdsNotImplementedError('createOrder', 'Phase 5'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_IMPLEMENTED);
  });
});
