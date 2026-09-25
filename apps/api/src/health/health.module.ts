import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { GdsModule } from '../gds/gds.module';
import { PaymentsModule } from '../payments/payments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TravelportModule } from '../travelport/travelport.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    TerminusModule,
    AmadeusModule,
    TravelportModule,
    GdsModule,
    PaymentsModule,
    PrismaModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
