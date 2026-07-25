import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import Stripe from 'stripe';
import { PaymentRecordRepository } from './payment-record.repository';
import { PaymentsController } from './payments.controller';
import { STRIPE_CLIENT } from './payments.constants';
import { PaymentsService } from './payments.service';
import { StripeHealthIndicator } from './stripe-health.indicator';
import { StripeService } from './stripe.service';

@Module({
  imports: [TerminusModule],
  controllers: [PaymentsController],
  providers: [
    {
      // Secret key is allowed to be empty at boot (see env.validation.ts) so
      // the app can still start during local setup - but unlike Amadeus's
      // client, the Stripe SDK's own constructor throws synchronously on a
      // falsy key ("Neither apiKey nor config.authenticator provided"),
      // which would crash the whole Nest DI container at boot rather than
      // just this module. A placeholder key sidesteps that: it only checks
      // truthiness at construction, so real calls still fail loudly and
      // safely (StripeAuthenticationError) once something actually calls
      // Stripe with no real key configured.
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Stripe(
          config.get<string>('STRIPE_SECRET_KEY', '') ||
            'sk_test_not_configured',
        ),
    },
    StripeService,
    PaymentRecordRepository,
    PaymentsService,
    StripeHealthIndicator,
  ],
  exports: [PaymentsService, StripeHealthIndicator],
})
export class PaymentsModule {}
