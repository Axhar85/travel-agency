import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, AmadeusModule],
  controllers: [HealthController],
})
export class HealthModule {}
