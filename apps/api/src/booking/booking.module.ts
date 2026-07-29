import { Module } from '@nestjs/common';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { PaymentsModule } from '../payments/payments.module';
import { BookingRecordRepository } from './booking-record.repository';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [AmadeusModule, PaymentsModule],
  controllers: [BookingController],
  providers: [BookingService, BookingRecordRepository],
  // Exported so AccountModule can list a logged-in customer's bookings
  // (GET /account/bookings) without reaching into BookingModule's internals.
  exports: [BookingRecordRepository],
})
export class BookingModule {}
