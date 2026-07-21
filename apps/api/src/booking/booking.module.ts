import { Module } from '@nestjs/common';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';

@Module({
  imports: [AmadeusModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
