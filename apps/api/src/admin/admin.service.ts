import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { RequestSession } from '../booking/booking-session.types';
import { AdminLoginRateLimiter } from './admin-login-rate-limiter.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly config: ConfigService,
    private readonly rateLimiter: AdminLoginRateLimiter,
  ) {}

  async login(
    session: RequestSession,
    password: string,
    ip: string,
  ): Promise<void> {
    if (!(await this.rateLimiter.isAllowed(ip))) {
      throw new UnauthorizedException(
        'Too many login attempts. Please wait and try again.',
      );
    }

    const hash = this.config.get<string>('ADMIN_PASSWORD_HASH', '');
    const valid = hash ? await bcrypt.compare(password, hash) : false;

    if (!valid) {
      await this.rateLimiter.recordFailure(ip);
      throw new UnauthorizedException('Incorrect password.');
    }

    await this.rateLimiter.reset(ip);
    session.isAdmin = true;
  }
}
