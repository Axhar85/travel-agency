import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { AmadeusAuthService } from './self-service/amadeus-auth.service';

/**
 * Mode-aware on purpose: self-service connectivity means "can we get an
 * OAuth2 token". Enterprise connectivity will mean something else (e.g. a
 * live SOAP session ping) — that logic stays internal to AmadeusModule, the
 * rest of the app only ever sees a HealthIndicatorResult.
 */
@Injectable()
export class AmadeusHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly authService: AmadeusAuthService,
  ) {}

  async check(key: string) {
    const indicator = this.healthIndicatorService.check(key);

    try {
      await this.authService.getAccessToken();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: (error as Error).message });
    }
  }
}
