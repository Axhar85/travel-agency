import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AmadeusHealthIndicator } from './amadeus-health.indicator';
import { GDS_CLIENT } from './amadeus.constants';
import { AmadeusService } from './amadeus.service';
import { GdsClient } from './interfaces/gds-client.interface';
import { AmadeusAuthService } from './self-service/amadeus-auth.service';
import { AmadeusSelfServiceClient } from './self-service/amadeus-self-service.client';
import { OfferCacheService } from './self-service/offer-cache.service';

@Module({
  imports: [HttpModule.register({ timeout: 10_000 }), TerminusModule],
  providers: [
    AmadeusAuthService,
    OfferCacheService,
    AmadeusSelfServiceClient,
    AmadeusHealthIndicator,
    AmadeusService,
    {
      // The only place AMADEUS_MODE is read. Swapping to Enterprise means
      // adding an AmadeusEnterpriseClient implementing GdsClient and
      // returning it here — no other file in this module or the app changes.
      provide: GDS_CLIENT,
      inject: [ConfigService, AmadeusSelfServiceClient],
      useFactory: (
        config: ConfigService,
        selfServiceClient: AmadeusSelfServiceClient,
      ): GdsClient => {
        const mode = config.getOrThrow<string>('AMADEUS_MODE');
        switch (mode) {
          case 'self-service':
            return selfServiceClient;
          case 'enterprise':
            throw new Error(
              'AMADEUS_MODE=enterprise has no implementation yet — the Enterprise/SOAP swap is a future phase',
            );
          default:
            throw new Error(`Unknown AMADEUS_MODE: ${mode}`);
        }
      },
    },
  ],
  exports: [AmadeusService, AmadeusHealthIndicator],
})
export class AmadeusModule {}
