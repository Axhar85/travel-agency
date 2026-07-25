import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { AmadeusHealthIndicator } from '../amadeus/amadeus-health.indicator';
import { StripeHealthIndicator } from '../payments/stripe-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly amadeusHealth: AmadeusHealthIndicator,
    private readonly stripeHealth: StripeHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.amadeusHealth.check('amadeus'),
      () => this.stripeHealth.check('stripe'),
    ]);
  }
}
