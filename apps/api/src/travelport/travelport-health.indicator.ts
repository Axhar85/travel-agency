import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { TravelportAuthService } from './travelport-auth.service';

/**
 * Connectivity means "can we get an OAuth token with the configured
 * credentials" - the same bar as AmadeusHealthIndicator. It's the first thing
 * that proves trial credentials, grant type, and endpoint are all correct.
 */
@Injectable()
export class TravelportHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly authService: TravelportAuthService,
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
