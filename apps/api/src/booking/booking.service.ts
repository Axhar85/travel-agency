import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AmadeusService } from '../amadeus/amadeus.service';
import { PaymentsService } from '../payments/payments.service';
import { BookingRecordRepository } from './booking-record.repository';
import {
  BookingSessionData,
  PassengerCounts,
  RequestSession,
} from './booking-session.types';
import { StartBookingDto } from './dto/start-booking.dto';
import { SubmitPassengersDto } from './dto/submit-passengers.dto';

@Injectable()
export class BookingService {
  constructor(
    private readonly amadeusService: AmadeusService,
    private readonly paymentsService: PaymentsService,
    private readonly bookingRecords: BookingRecordRepository,
  ) {}

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

  async getState(session: RequestSession): Promise<BookingSessionData> {
    if (!session.booking) {
      throw new NotFoundException(
        'No booking in progress — start a new search.',
      );
    }
    // Payment status only ever changes via Stripe's webhook, which has no
    // session cookie to update it with directly - refresh from the Redis
    // record of truth on every read instead (see PaymentsService).
    const previousStep = session.booking.step;
    await this.paymentsService.refreshPaymentStatus(session);
    const booking = session.booking;

    // Persist exactly once, on the transition edge into a terminal payment
    // state - not on every subsequent poll of this endpoint while the
    // confirmation screen is open (getState() is polled repeatedly).
    if (
      previousStep !== booking.step &&
      (booking.step === 'payment_authorized' || booking.step === 'payment_failed')
    ) {
      await this.bookingRecords.upsertFromSession(
        session.userId,
        booking,
        booking.step === 'payment_authorized'
          ? 'PAYMENT_AUTHORIZED'
          : 'PAYMENT_FAILED',
      );
    }

    return booking;
  }

  async submitPassengers(
    session: RequestSession,
    dto: SubmitPassengersDto,
  ): Promise<BookingSessionData> {
    const booking = await this.getState(session);
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
