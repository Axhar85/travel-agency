import { Module } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminLoginRateLimiter } from './admin-login-rate-limiter.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AdminLoginRateLimiter, AdminAuthGuard],
  exports: [AdminAuthGuard],
})
export class AdminModule {}
