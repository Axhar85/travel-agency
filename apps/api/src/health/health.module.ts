import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { PaymentsModule } from '../payments/payments.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, AmadeusModule, PaymentsModule],
  controllers: [HealthController],
})
export class HealthModule {}
