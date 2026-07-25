import { Controller, Headers, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentIntentResult, PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) {}

  @Post('intent')
  createIntent(@Req() req: Request): Promise<PaymentIntentResult> {
    return this.paymentsService.createOrReuseIntent(req.session, req.sessionID);
  }

  // Stripe calls this server-to-server with no session cookie - signature
  // verification against the raw body is the only authentication here.
  // `rawBody` is populated by NestFactory.create's `rawBody: true` option
  // (see main.ts); it must never go through the global JSON body parser
  // first or the signature check fails.
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    const event = this.stripeService.constructWebhookEvent(
      req.rawBody ?? Buffer.alloc(0),
      signature,
    );
    await this.paymentsService.handleWebhookEvent(event);
    return { received: true };
  }
}
