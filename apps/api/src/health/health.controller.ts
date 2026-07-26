import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { AmadeusHealthIndicator } from '../amadeus/amadeus-health.indicator';
import { StripeHealthIndicator } from '../payments/stripe-health.indicator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly amadeusHealth: AmadeusHealthIndicator,
    private readonly stripeHealth: StripeHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.amadeusHealth.check('amadeus'),
      () => this.stripeHealth.check('stripe'),
      () => this.prismaHealth.pingCheck('database', this.prisma),
    ]);
  }
}
