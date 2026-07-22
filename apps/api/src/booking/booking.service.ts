import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AmadeusService } from '../amadeus/amadeus.service';
import {
  BookingSessionData,
  PassengerCounts,
  RequestSession,
} from './booking-session.types';
import { StartBookingDto } from './dto/start-booking.dto';
import { SubmitPassengersDto } from './dto/submit-passengers.dto';

@Injectable()
export class BookingService {
  constructor(private readonly amadeusService: AmadeusService) {}

  async startBooking(
    session: RequestSession,
    dto: StartBookingDto,
  ): Promise<BookingSessionData> {
    // Re-price on entering the funnel, same as Phase 2's price-confirmation
    // step - the offer may have been sitting in the results list for a
    // while before the customer clicked through.
    const pricedOffer = await this.amadeusService.priceOffer(dto.offerId);

    const passengerCounts: PassengerCounts = {
      adults: dto.adults,
      children: dto.children ?? 0,
      infants: dto.infants ?? 0,
    };

    const booking: BookingSessionData = {
      pricedOffer,
      passengerCounts,
      passengers: [],
      step: 'passengers',
    };
    session.booking = booking;
    return booking;
  }

  getState(session: RequestSession): BookingSessionData {
    if (!session.booking) {
      throw new NotFoundException(
        'No booking in progress — start a new search.',
      );
    }
    return session.booking;
  }

  submitPassengers(
    session: RequestSession,
    dto: SubmitPassengersDto,
  ): BookingSessionData {
    const booking = this.getState(session);
    const expectedTotal =
      booking.passengerCounts.adults +
      booking.passengerCounts.children +
      booking.passengerCounts.infants;

    if (dto.passengers.length !== expectedTotal) {
      throw new BadRequestException(
        `Expected ${expectedTotal} passenger(s) to match the original search, got ${dto.passengers.length}.`,
      );
    }

    const counts = { ADULT: 0, CHILD: 0, INFANT: 0 };
    for (const passenger of dto.passengers) {
      counts[passenger.type] += 1;
    }
    if (
      counts.ADULT !== booking.passengerCounts.adults ||
      counts.CHILD !== booking.passengerCounts.children ||
      counts.INFANT !== booking.passengerCounts.infants
    ) {
      throw new BadRequestException(
        'Passenger types do not match the original search.',
      );
    }

    booking.passengers = dto.passengers;
    booking.step = 'review';
    session.booking = booking;
    return booking;
  }
}
