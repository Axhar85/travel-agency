import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { AmadeusService } from '../amadeus/amadeus.service';
import { TravelportClient } from '../travelport/travelport.client';
import { TravelportModule } from '../travelport/travelport.module';
import { parseEnabledProviders } from './enabled-providers';
import { GDS_PROVIDERS } from './gds.constants';
import { GdsService } from './gds.service';
import {
  GdsClient,
  GdsProviderEntry,
  GdsProviderName,
} from './interfaces/gds-client.interface';

/**
 * The only place that knows which providers exist and which are switched on.
 * Adding a provider = a new module implementing GdsClient, one entry in the
 * map below, and its name in GDS_PROVIDERS - callers never change.
 */
@Module({
  imports: [AmadeusModule, TravelportModule],
  providers: [
    {
      provide: GDS_PROVIDERS,
      inject: [ConfigService, AmadeusService, TravelportClient],
      useFactory: (
        config: ConfigService,
        amadeus: AmadeusService,
        travelport: TravelportClient,
      ): GdsProviderEntry[] => {
        const available: Record<GdsProviderName, GdsClient> = {
          amadeus,
          travelport,
        };
        return parseEnabledProviders(
          config.get<string>('GDS_PROVIDERS', 'amadeus'),
        ).map((name) => ({ name, client: available[name] }));
      },
    },
    GdsService,
  ],
  exports: [GdsService],
})
export class GdsModule {}
