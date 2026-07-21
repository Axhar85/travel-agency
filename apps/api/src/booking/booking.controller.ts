import { Body, Controller, Get, Post, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BookingService } from './booking.service';
import type { BookingSessionData } from './booking-session.types';
import { StartBookingDto } from './dto/start-booking.dto';
import { SubmitPassengersDto } from './dto/submit-passengers.dto';

@Controller('booking')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Post('start')
  start(
    @Req() req: Request,
    @Body() dto: StartBookingDto,
  ): Promise<BookingSessionData> {
    return this.bookingService.startBooking(req.session, dto);
  }

  @Get('state')
  getState(@Req() req: Request): BookingSessionData {
    return this.bookingService.getState(req.session);
  }

  @Put('passengers')
  submitPassengers(
    @Req() req: Request,
    @Body() dto: SubmitPassengersDto,
  ): BookingSessionData {
    return this.bookingService.submitPassengers(req.session, dto);
  }
}
