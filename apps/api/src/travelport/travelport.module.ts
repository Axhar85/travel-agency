import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TravelportAuthService } from './travelport-auth.service';
import { TravelportClient } from './travelport.client';
import { TravelportHealthIndicator } from './travelport-health.indicator';

/**
 * Travelport (Galileo) as a GDS provider. Not enabled unless "travelport" is
 * listed in GDS_PROVIDERS (see GdsModule); constructing these providers never
 * needs credentials - auth is only attempted on first use / health check.
 */
@Module({
  imports: [HttpModule.register({ timeout: 10_000 }), TerminusModule],
  providers: [
    TravelportAuthService,
    TravelportClient,
    TravelportHealthIndicator,
  ],
  exports: [TravelportClient, TravelportHealthIndicator],
})
export class TravelportModule {}
