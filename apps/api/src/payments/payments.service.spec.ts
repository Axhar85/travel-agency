import { BadRequestException, NotFoundException } from '@nestjs/common';
import type Stripe from 'stripe';
import type {
  BookingSessionData,
  RequestSession,
} from '../booking/booking-session.types';
import { PaymentRecordRepository } from './payment-record.repository';
import { PaymentRecord } from './payment-record.types';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

const pricedOffer = {
  id: 'offer-1',
  contentSource: 'GDS',
  itineraries: [],
  price: { currency: 'EUR', total: '450.00', base: '400.00' },
  validatingAirlineCodes: ['IB'],
  priceChanged: false,
  originalTotal: '450.00',
};

function buildBooking(
  overrides: Partial<BookingSessionData> = {},
): BookingSessionData {
  return {
    pricedOffer,
    passengerCounts: { adults: 1, children: 0, infants: 0 },
    passengers: [],
    step: 'review',
    ...overrides,
  };
}

function buildSession(booking?: BookingSessionData): RequestSession {
  return { booking } as unknown as RequestSession;
}

function buildDeps() {
  const stripeService = {
    createPaymentIntent: jest.fn(),
    retrievePaymentIntent: jest.fn(),
  } as unknown as StripeService;
  const store = new Map<string, PaymentRecord>();
  const records = {
    get: jest.fn(async (id: string) => store.get(id) ?? null),
    save: jest.fn(async (record: PaymentRecord) => {
      store.set(record.paymentIntentId, record);
    }),
  } as unknown as PaymentRecordRepository;
  const service = new PaymentsService(stripeService, records);
  return { service, stripeService, records, store };
}

describe('PaymentsService.createOrReuseIntent', () => {
  it('throws NotFoundException when there is no booking in progress', async () => {
    const { service } = buildDeps();
    await expect(
      service.createOrReuseIntent(buildSession(undefined), 'sess-1'),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException before passenger details are submitted', async () => {
    const { service } = buildDeps();
    const session = buildSession(buildBooking({ step: 'passengers' }));

    await expect(
      service.createOrReuseIntent(session, 'sess-1'),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates a new manual-capture intent with the correct amount/currency and an idempotency key', async () => {
    const { service, stripeService, records } = buildDeps();
    (stripeService.createPaymentIntent as jest.Mock).mockResolvedValue({
      id: 'pi_new',
      client_secret: 'pi_new_secret',
    });
    const session = buildSession(buildBooking());

    const result = await service.createOrReuseIntent(session, 'sess-1');

    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith({
      amountMinorUnits: 45_000,
      currency: 'EUR',
      idempotencyKey: 'sess-1:intent:initial',
      metadata: { bookingSessionId: 'sess-1' },
    });
    expect(records.save).toHaveBeenCalledWith(
      expect.objectContaining({
        paymentIntentId: 'pi_new',
        status: 'requires_payment',
      }),
    );
    expect(result).toEqual({
      clientSecret: 'pi_new_secret',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'requires_payment',
    });
    expect(session.booking?.payment).toEqual({
      paymentIntentId: 'pi_new',
      status: 'requires_payment',
    });
    expect(session.booking?.step).toBe('payment');
  });

  it('reuses an existing still-open intent instead of creating a second one', async () => {
    const { service, stripeService, store } = buildDeps();
    store.set('pi_open', {
      paymentIntentId: 'pi_open',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'requires_action',
      createdAt: 'now',
      updatedAt: 'now',
    });
    (stripeService.retrievePaymentIntent as jest.Mock).mockResolvedValue({
      client_secret: 'pi_open_secret',
    });
    const session = buildSession(
      buildBooking({
        payment: { paymentIntentId: 'pi_open', status: 'requires_action' },
      }),
    );

    const result = await service.createOrReuseIntent(session, 'sess-1');

    expect(stripeService.createPaymentIntent).not.toHaveBeenCalled();
    expect(stripeService.retrievePaymentIntent).toHaveBeenCalledWith('pi_open');
    expect(result.clientSecret).toBe('pi_open_secret');
    expect(result.status).toBe('requires_action');
  });

  it('returns the existing record without contacting Stripe when already authorized', async () => {
    const { service, stripeService, store } = buildDeps();
    store.set('pi_done', {
      paymentIntentId: 'pi_done',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'authorized',
      createdAt: 'now',
      updatedAt: 'now',
    });
    const session = buildSession(
      buildBooking({
        payment: { paymentIntentId: 'pi_done', status: 'authorized' },
      }),
    );

    const result = await service.createOrReuseIntent(session, 'sess-1');

    expect(stripeService.createPaymentIntent).not.toHaveBeenCalled();
    expect(stripeService.retrievePaymentIntent).not.toHaveBeenCalled();
    expect(result.status).toBe('authorized');
  });

  it('starts a fresh attempt with a new idempotency key after a failed payment', async () => {
    const { service, stripeService, store } = buildDeps();
    store.set('pi_failed', {
      paymentIntentId: 'pi_failed',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'failed',
      createdAt: 'now',
      updatedAt: 'now',
    });
    (stripeService.createPaymentIntent as jest.Mock).mockResolvedValue({
      id: 'pi_retry',
      client_secret: 'pi_retry_secret',
    });
    const session = buildSession(
      buildBooking({
        payment: { paymentIntentId: 'pi_failed', status: 'failed' },
      }),
    );

    await service.createOrReuseIntent(session, 'sess-1');

    expect(stripeService.createPaymentIntent).toHaveBeenCalledWith(
      expect.objectContaining({ idempotencyKey: 'sess-1:intent:pi_failed' }),
    );
  });
});

describe('PaymentsService.refreshPaymentStatus', () => {
  it('is a no-op when the booking has no payment pointer yet', async () => {
    const { service, records } = buildDeps();
    const session = buildSession(buildBooking());

    const status = await service.refreshPaymentStatus(session);

    expect(status).toBeUndefined();
    expect(records.get).not.toHaveBeenCalled();
  });

  it('refreshes the session pointer and advances the step when authorized', async () => {
    const { service, store } = buildDeps();
    store.set('pi_1', {
      paymentIntentId: 'pi_1',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'authorized',
      createdAt: 'now',
      updatedAt: 'now',
    });
    const session = buildSession(
      buildBooking({
        step: 'payment',
        payment: { paymentIntentId: 'pi_1', status: 'requires_payment' },
      }),
    );

    const status = await service.refreshPaymentStatus(session);

    expect(status).toBe('authorized');
    expect(session.booking?.payment?.status).toBe('authorized');
    expect(session.booking?.step).toBe('payment_authorized');
  });

  it('advances to payment_failed when the record shows a failure', async () => {
    const { service, store } = buildDeps();
    store.set('pi_1', {
      paymentIntentId: 'pi_1',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'failed',
      createdAt: 'now',
      updatedAt: 'now',
    });
    const session = buildSession(
      buildBooking({
        step: 'payment',
        payment: { paymentIntentId: 'pi_1', status: 'requires_payment' },
      }),
    );

    await service.refreshPaymentStatus(session);

    expect(session.booking?.step).toBe('payment_failed');
  });
});

describe('PaymentsService.handleWebhookEvent', () => {
  function buildEvent(
    type: Stripe.Event['type'],
    intent: Partial<Stripe.PaymentIntent>,
  ): Stripe.Event {
    return {
      type,
      data: { object: { id: 'pi_1', ...intent } },
    } as unknown as Stripe.Event;
  }

  it('marks a payment intent as authorized on amount_capturable_updated', async () => {
    const { service, store } = buildDeps();
    store.set('pi_1', {
      paymentIntentId: 'pi_1',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'requires_payment',
      createdAt: 'now',
      updatedAt: 'now',
    });

    await service.handleWebhookEvent(
      buildEvent('payment_intent.amount_capturable_updated', {}),
    );

    expect(store.get('pi_1')?.status).toBe('authorized');
  });

  it('records the decline reason on payment_failed', async () => {
    const { service, store } = buildDeps();
    store.set('pi_1', {
      paymentIntentId: 'pi_1',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'requires_payment',
      createdAt: 'now',
      updatedAt: 'now',
    });

    await service.handleWebhookEvent(
      buildEvent('payment_intent.payment_failed', {
        last_payment_error: { message: 'Your card was declined.' } as never,
      }),
    );

    const record = store.get('pi_1');
    expect(record?.status).toBe('failed');
    expect(record?.lastError).toBe('Your card was declined.');
  });

  it('ignores events for a payment intent it has no record of', async () => {
    const { service, records } = buildDeps();

    await service.handleWebhookEvent(
      buildEvent('payment_intent.amount_capturable_updated', {}),
    );

    expect(records.save).not.toHaveBeenCalled();
  });

  it('ignores unrelated event types', async () => {
    const { service, store } = buildDeps();
    store.set('pi_1', {
      paymentIntentId: 'pi_1',
      bookingSessionId: 'sess-1',
      amountMinorUnits: 45_000,
      currency: 'EUR',
      status: 'requires_payment',
      createdAt: 'now',
      updatedAt: 'now',
    });

    await service.handleWebhookEvent(
      buildEvent('payment_intent.succeeded', {}),
    );

    expect(store.get('pi_1')?.status).toBe('requires_payment');
  });
});
