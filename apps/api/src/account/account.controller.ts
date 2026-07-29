import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { BookingRecordRepository } from '../booking/booking-record.repository';
import { AccountAuthGuard } from './account-auth.guard';
import { AccountService, SafeUser } from './account.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly bookingRecords: BookingRecordRepository,
  ) {}

  @Post('register')
  @HttpCode(201)
  register(@Req() req: Request, @Body() dto: RegisterDto): Promise<SafeUser> {
    return this.accountService.register(req.session, dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Req() req: Request, @Body() dto: LoginDto): Promise<SafeUser> {
    return this.accountService.login(
      req.session,
      dto.email,
      dto.password,
      req.ip ?? 'unknown',
    );
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: Request): { success: true } {
    this.accountService.logout(req.session);
    return { success: true };
  }

  @UseGuards(AccountAuthGuard)
  @Get('me')
  me(@Req() req: Request): Promise<SafeUser> {
    return this.accountService.me(req.session);
  }

  // Deliberately filters strictly by the guard-verified session.userId -
  // never accepts an id/email parameter, so there's no path to looking up
  // someone else's booking.
  @UseGuards(AccountAuthGuard)
  @Get('bookings')
  bookings(@Req() req: Request) {
    return this.bookingRecords.findByUserId(req.session.userId!);
  }
}
