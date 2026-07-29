import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { AccountAuthGuard } from './account-auth.guard';
import { AccountLoginRateLimiter } from './account-login-rate-limiter.service';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [BookingModule],
  controllers: [AccountController],
  providers: [AccountService, AccountLoginRateLimiter, AccountAuthGuard],
  exports: [AccountAuthGuard],
})
export class AccountModule {}
