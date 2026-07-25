import { Module } from '@nestjs/common';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { PaymentsModule } from '../payments/payments.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [AmadeusModule, PaymentsModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
