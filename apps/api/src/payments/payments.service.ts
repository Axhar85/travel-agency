import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type Stripe from 'stripe';
import type { RequestSession } from '../booking/booking-session.types';
import { toStripeMinorUnits } from './currency-minor-units';
import { PaymentRecordRepository } from './payment-record.repository';
import { PaymentRecord, PaymentStatus } from './payment-record.types';
import { StripeService } from './stripe.service';

export interface PaymentIntentResult {
  clientSecret: string | null;
  amountMinorUnits: number;
  currency: string;
  status: PaymentStatus;
}

const OPEN_STATUSES: PaymentStatus[] = ['requires_payment', 'requires_action'];

@Injectable()
export class PaymentsService {
  constructor(
    private readonly stripeService: StripeService,
    private readonly records: PaymentRecordRepository,
  ) {}

  async createOrReuseIntent(
    session: RequestSession,
    sessionId: string,
  ): Promise<PaymentIntentResult> {
    const booking = session.booking;
    if (!booking) {
      throw new NotFoundException(
        'No booking in progress — start a new search.',
      );
    }
    if (booking.step === 'passengers') {
      throw new BadRequestException(
        'Submit passenger details before proceeding to payment.',
      );
    }

    if (booking.payment) {
      const existing = await this.records.get(booking.payment.paymentIntentId);
      if (existing && OPEN_STATUSES.includes(existing.status)) {
        const intent = await this.stripeService.retrievePaymentIntent(
          existing.paymentIntentId,
        );
        return {
          clientSecret: intent.client_secret,
          amountMinorUnits: existing.amountMinorUnits,
          currency: existing.currency,
          status: existing.status,
        };
      }
      if (existing?.status === 'authorized') {
        return {
          clientSecret: null,
          amountMinorUnits: existing.amountMinorUnits,
          currency: existing.currency,
          status: existing.status,
        };
      }
      // 'canceled' / 'failed' / missing record - fall through and start a
      // fresh authorization attempt below.
    }

    const { pricedOffer } = booking;
    const amountMinorUnits = toStripeMinorUnits(
      pricedOffer.price.total,
      pricedOffer.price.currency,
    );
    const currency = pricedOffer.price.currency;

    // Stable across concurrent double-submits of the *same* logical attempt
    // (both see the same booking.payment cursor, so Stripe's own idempotency
    // layer collapses them into one PaymentIntent) but distinct on a genuine
    // retry-after-failure, since the cursor then points at the failed id.
    const idempotencyKey = `${sessionId}:intent:${booking.payment?.paymentIntentId ?? 'initial'}`;

    const intent = await this.stripeService.createPaymentIntent({
      amountMinorUnits,
      currency,
      idempotencyKey,
      metadata: { bookingSessionId: sessionId },
    });

    const now = new Date().toISOString();
    const record: PaymentRecord = {
      paymentIntentId: intent.id,
      bookingSessionId: sessionId,
      amountMinorUnits,
      currency,
      status: 'requires_payment',
      createdAt: now,
      updatedAt: now,
    };
    await this.records.save(record);

    booking.payment = {
      paymentIntentId: intent.id,
      status: 'requires_payment',
    };
    booking.step = 'payment';
    session.booking = booking;

    return {
      clientSecret: intent.client_secret,
      amountMinorUnits,
      currency,
      status: 'requires_payment',
    };
  }

  /** Refreshes the session's payment pointer from the Redis record of record - called from BookingService.getState(). */
  async refreshPaymentStatus(
    session: RequestSession,
  ): Promise<PaymentStatus | undefined> {
    const booking = session.booking;
    if (!booking?.payment) return undefined;

    const record = await this.records.get(booking.payment.paymentIntentId);
    if (!record) return booking.payment.status;

    booking.payment.status = record.status;
    if (record.status === 'authorized') booking.step = 'payment_authorized';
    if (record.status === 'failed') booking.step = 'payment_failed';
    session.booking = booking;
    return record.status;
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    const status = this.statusForEvent(event.type);
    if (!status) return;

    const intent = event.data.object as Stripe.PaymentIntent;
    const existing = await this.records.get(intent.id);
    if (!existing) return; // event for a PaymentIntent we didn't create (or already expired from Redis)

    existing.status = status;
    existing.updatedAt = new Date().toISOString();
    if (event.type === 'payment_intent.payment_failed') {
      existing.lastError = intent.last_payment_error?.message;
    }
    await this.records.save(existing);
  }

  private statusForEvent(type: Stripe.Event['type']): PaymentStatus | null {
    switch (type) {
      case 'payment_intent.amount_capturable_updated':
        return 'authorized';
      case 'payment_intent.requires_action':
        return 'requires_action';
      case 'payment_intent.payment_failed':
        return 'failed';
      case 'payment_intent.canceled':
        return 'canceled';
      default:
        return null;
    }
  }
}
