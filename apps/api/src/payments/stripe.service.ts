import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './payments.constants';

export interface CreatePaymentIntentParams {
  amountMinorUnits: number;
  currency: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
}

/**
 * Thin wrapper around the Stripe SDK - mirrors AmadeusService's role of
 * being the one place the rest of the app touches a third-party payment
 * client directly, so raw Stripe error shapes/objects don't leak into
 * PaymentsService's business logic.
 */
@Injectable()
export class StripeService {
  private readonly webhookSecret: string;

  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    config: ConfigService,
  ) {
    this.webhookSecret = config.get<string>('STRIPE_WEBHOOK_SECRET', '');
  }

  createPaymentIntent(
    params: CreatePaymentIntentParams,
  ): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.create(
      {
        amount: params.amountMinorUnits,
        currency: params.currency.toLowerCase(),
        // Authorize only - CLAUDE.md requires authorizing before calling
        // Amadeus createOrder() and auto-voiding on booking failure, which
        // only works cleanly against an uncaptured authorization.
        capture_method: 'manual',
        automatic_payment_methods: { enabled: true },
        metadata: params.metadata,
      },
      { idempotencyKey: params.idempotencyKey },
    );
  }

  retrievePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(id);
  }

  capturePaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.capture(id);
  }

  cancelPaymentIntent(id: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.cancel(id);
  }

  balanceCheck(): Promise<Stripe.Balance> {
    return this.stripe.balance.retrieve();
  }

  constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret,
    );
  }
}
