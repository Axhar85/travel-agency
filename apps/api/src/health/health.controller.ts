import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorFunction,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { AmadeusHealthIndicator } from '../amadeus/amadeus-health.indicator';
import { GdsService } from '../gds/gds.service';
import { StripeHealthIndicator } from '../payments/stripe-health.indicator';
import { PrismaService } from '../prisma/prisma.service';
import { TravelportHealthIndicator } from '../travelport/travelport-health.indicator';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly gds: GdsService,
    private readonly amadeusHealth: AmadeusHealthIndicator,
    private readonly travelportHealth: TravelportHealthIndicator,
    private readonly stripeHealth: StripeHealthIndicator,
    private readonly prismaHealth: PrismaHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    // Only providers switched on in GDS_PROVIDERS are checked - a provider
    // that's deliberately off (or has no credentials yet) must not hold the
    // whole service at 503.
    const checks: HealthIndicatorFunction[] = [];
    if (this.gds.isEnabled('amadeus')) {
      checks.push(() => this.amadeusHealth.check('amadeus'));
    }
    if (this.gds.isEnabled('travelport')) {
      checks.push(() => this.travelportHealth.check('travelport'));
    }
    checks.push(
      () => this.stripeHealth.check('stripe'),
      () => this.prismaHealth.pingCheck('database', this.prisma),
    );
    return this.health.check(checks);
  }
}
