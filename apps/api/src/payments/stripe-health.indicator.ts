import { Inject, Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import Stripe from 'stripe';
import { STRIPE_CLIENT } from './payments.constants';

/** Mirrors AmadeusHealthIndicator's shape: a cheap live call that proves the configured secret key actually works. */
@Injectable()
export class StripeHealthIndicator {
  constructor(
    @Inject(STRIPE_CLIENT) private readonly stripe: Stripe,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.stripe.balance.retrieve();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
