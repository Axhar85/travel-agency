import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AmadeusService } from '../amadeus/amadeus.service';
import { PricedOffer } from '../amadeus/interfaces/gds-client.interface';
import { PaymentsService } from '../payments/payments.service';
import { BookingRecordRepository } from './booking-record.repository';
import { BookingService } from './booking.service';
import { RequestSession } from './booking-session.types';
import { StartBookingDto } from './dto/start-booking.dto';
import { PassengerDto } from './dto/passenger.dto';
import { SubmitPassengersDto } from './dto/submit-passengers.dto';

const pricedOffer: PricedOffer = {
  id: 'offer-1',
  contentSource: 'GDS',
  itineraries: [],
  price: { currency: 'EUR', total: '199.99', base: '150.00' },
  validatingAirlineCodes: ['IB'],
  priceChanged: false,
  originalTotal: '199.99',
};

function buildSession(): RequestSession {
  return {} as RequestSession;
}

function buildAdult(overrides: Partial<PassengerDto> = {}): PassengerDto {
  return {
    type: 'ADULT',
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'MALE',
    email: 'john@example.com',
    phone: '+34600123456',
    ...overrides,
  };
}

describe('BookingService', () => {
  function buildService() {
    const amadeusService = {
      priceOffer: jest.fn().mockResolvedValue(pricedOffer),
    } as unknown as AmadeusService;
    const paymentsService = {
      refreshPaymentStatus: jest.fn().mockResolvedValue(undefined),
    } as unknown as PaymentsService;
    const bookingRecords = {
      upsertFromSession: jest.fn().mockResolvedValue(undefined),
      findByUserId: jest.fn().mockResolvedValue([]),
    } as unknown as BookingRecordRepository;
    const service = new BookingService(amadeusService, paymentsService, bookingRecords);
    return { service, amadeusService, paymentsService, bookingRecords };
  }

  it('startBooking re-prices the offer and stores the booking in the session', async () => {
    const { service, amadeusService } = buildService();
    const session = buildSession();
    const dto: StartBookingDto = {
      offerId: 'offer-1',
      adults: 1,
      children: 0,
      infants: 0,
    };

    const result = await service.startBooking(session, dto);

    expect(amadeusService.priceOffer).toHaveBeenCalledWith('offer-1');
    expect(result).toEqual({
      pricedOffer,
      passengerCounts: { adults: 1, children: 0, infants: 0 },
      passengers: [],
      step: 'passengers',
    });
    expect(session.booking).toEqual(result);
  });

  it('getState throws NotFoundException when no booking is in progress', async () => {
    const { service } = buildService();
    const session = buildSession();

    await expect(service.getState(session)).rejects.toThrow(NotFoundException);
  });

  it('getState returns the stored booking', async () => {
    const { service } = buildService();
    const session = buildSession();
    await service.startBooking(session, { offerId: 'offer-1', adults: 1 });

    const state = await service.getState(session);
    expect(state.step).toBe('passengers');
  });

  it('submitPassengers stores passengers and advances the step when counts match', async () => {
    const { service } = buildService();
    const session = buildSession();
    await service.startBooking(session, {
      offerId: 'offer-1',
      adults: 1,
      infants: 1,
    });
    const dto: SubmitPassengersDto = {
      passengers: [
        buildAdult(),
        buildAdult({ type: 'INFANT', email: undefined, phone: undefined }),
      ],
    };

    const result = await service.submitPassengers(session, dto);

    expect(result.step).toBe('review');
    expect(result.passengers).toHaveLength(2);
    expect(session.booking?.step).toBe('review');
  });

  it('submitPassengers rejects a passenger count mismatch', async () => {
    const { service } = buildService();
    const session = buildSession();
    await service.startBooking(session, { offerId: 'offer-1', adults: 2 });
    const dto: SubmitPassengersDto = { passengers: [buildAdult()] };

    await expect(service.submitPassengers(session, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('submitPassengers rejects a passenger type mismatch even if the total count matches', async () => {
    const { service } = buildService();
    const session = buildSession();
    await service.startBooking(session, {
      offerId: 'offer-1',
      adults: 1,
      children: 1,
    });
    // 2 adults instead of 1 adult + 1 child - same total, wrong breakdown.
    const dto: SubmitPassengersDto = {
      passengers: [buildAdult(), buildAdult()],
    };

    await expect(service.submitPassengers(session, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('submitPassengers throws NotFoundException if called before startBooking', async () => {
    const { service } = buildService();
    const session = buildSession();

    await expect(
      service.submitPassengers(session, { passengers: [buildAdult()] }),
    ).rejects.toThrow(NotFoundException);
  });

  describe('getState persistence on payment transitions', () => {
    async function startAtPaymentStep(
      service: BookingService,
      session: RequestSession,
    ) {
      await service.startBooking(session, { offerId: 'offer-1', adults: 1 });
      session.booking!.payment = { paymentIntentId: 'pi_1', status: 'requires_payment' };
      session.booking!.step = 'payment';
    }

    it('persists exactly once on the transition into payment_authorized', async () => {
      const { service, paymentsService, bookingRecords } = buildService();
      const session = buildSession();
      await startAtPaymentStep(service, session);
      (paymentsService.refreshPaymentStatus as jest.Mock).mockImplementation(async () => {
        session.booking!.step = 'payment_authorized';
      });

      await service.getState(session);

      expect(bookingRecords.upsertFromSession).toHaveBeenCalledTimes(1);
      expect(bookingRecords.upsertFromSession).toHaveBeenCalledWith(
        session.userId,
        session.booking,
        'PAYMENT_AUTHORIZED',
      );
    });

    it('does not persist again on a subsequent poll once already authorized', async () => {
      const { service, paymentsService, bookingRecords } = buildService();
      const session = buildSession();
      await startAtPaymentStep(service, session);
      session.booking!.step = 'payment_authorized'; // already transitioned on a prior call
      (paymentsService.refreshPaymentStatus as jest.Mock).mockResolvedValue(undefined);

      await service.getState(session);

      expect(bookingRecords.upsertFromSession).not.toHaveBeenCalled();
    });

    it('persists on the transition into payment_failed too, for a real audit trail', async () => {
      const { service, paymentsService, bookingRecords } = buildService();
      const session = buildSession();
      await startAtPaymentStep(service, session);
      (paymentsService.refreshPaymentStatus as jest.Mock).mockImplementation(async () => {
        session.booking!.step = 'payment_failed';
      });

      await service.getState(session);

      expect(bookingRecords.upsertFromSession).toHaveBeenCalledWith(
        session.userId,
        session.booking,
        'PAYMENT_FAILED',
      );
    });

    it('does not persist while still on an intermediate step (e.g. requires_action)', async () => {
      const { service, bookingRecords } = buildService();
      const session = buildSession();
      await startAtPaymentStep(service, session);

      await service.getState(session);

      expect(bookingRecords.upsertFromSession).not.toHaveBeenCalled();
    });
  });
});
