import type { Request } from 'express';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { StartBookingDto } from './dto/start-booking.dto';
import { SubmitPassengersDto } from './dto/submit-passengers.dto';

function buildRequest(): Request {
  return { session: {} } as unknown as Request;
}

describe('BookingController', () => {
  it('delegates start to BookingService with the session', async () => {
    const bookingService = {
      startBooking: jest.fn().mockResolvedValue({}),
      getState: jest.fn(),
      submitPassengers: jest.fn(),
    } as unknown as BookingService;
    const controller = new BookingController(bookingService);
    const req = buildRequest();
    const dto: StartBookingDto = { offerId: 'offer-1', adults: 1 };

    await controller.start(req, dto);

    expect(bookingService.startBooking).toHaveBeenCalledWith(req.session, dto);
  });

  it('delegates getState to BookingService with the session', () => {
    const bookingService = {
      startBooking: jest.fn(),
      getState: jest.fn().mockReturnValue({}),
      submitPassengers: jest.fn(),
    } as unknown as BookingService;
    const controller = new BookingController(bookingService);
    const req = buildRequest();

    controller.getState(req);

    expect(bookingService.getState).toHaveBeenCalledWith(req.session);
  });

  it('delegates submitPassengers to BookingService with the session', () => {
    const bookingService = {
      startBooking: jest.fn(),
      getState: jest.fn(),
      submitPassengers: jest.fn().mockReturnValue({}),
    } as unknown as BookingService;
    const controller = new BookingController(bookingService);
    const req = buildRequest();
    const dto: SubmitPassengersDto = { passengers: [] };

    controller.submitPassengers(req, dto);

    expect(bookingService.submitPassengers).toHaveBeenCalledWith(
      req.session,
      dto,
    );
  });
});
