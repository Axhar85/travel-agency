import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentsExceptionFilter } from './payments-exception.filter';

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

describe('PaymentsExceptionFilter', () => {
  const filter = new PaymentsExceptionFilter();

  it('passes StripeCardError message through as-is (Stripe writes these for end users)', () => {
    const { host, status, json } = buildHost();

    filter.catch(
      new Stripe.errors.StripeCardError({ message: 'Your card was declined.' }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.PAYMENT_REQUIRED);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Your card was declined.' }),
    );
  });

  it('maps every other Stripe error to a generic 503 without leaking detail', () => {
    const { host, status, json } = buildHost();

    filter.catch(
      new Stripe.errors.StripeAuthenticationError({
        message: 'Invalid API Key provided: sk_test_do_not_leak',
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    const body = json.mock.calls[0][0] as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toContain('sk_test_do_not_leak');
  });
});
