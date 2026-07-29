import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestSession } from '../booking/booking-session.types';
import { AccountLoginRateLimiter } from './account-login-rate-limiter.service';
import { RegisterDto } from './dto/register.dto';

export interface SafeUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

function toSafeUser(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}): SafeUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

@Injectable()
export class AccountService {
  private readonly sessionTtlMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rateLimiter: AccountLoginRateLimiter,
    config: ConfigService,
  ) {
    this.sessionTtlMs =
      config.get<number>('ACCOUNT_SESSION_TTL_SECONDS', 2_592_000) * 1000;
  }

  async register(
    session: RequestSession,
    dto: RegisterDto,
  ): Promise<SafeUser> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
    });

    this.startSession(session, user.id);
    return toSafeUser(user);
  }

  async login(
    session: RequestSession,
    email: string,
    password: string,
    ip: string,
  ): Promise<SafeUser> {
    if (!(await this.rateLimiter.isAllowed(ip))) {
      throw new UnauthorizedException(
        'Too many login attempts. Please wait and try again.',
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    const valid = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !valid) {
      await this.rateLimiter.recordFailure(ip);
      // Deliberately identical message whether the email doesn't exist or the
      // password is wrong - not confirming which emails have accounts.
      throw new UnauthorizedException('Incorrect email or password.');
    }

    await this.rateLimiter.reset(ip);
    this.startSession(session, user.id);
    return toSafeUser(user);
  }

  logout(session: RequestSession): void {
    // Only the account flag - session.booking (an in-progress guest booking)
    // and session.isAdmin are independent keys on the same session and must
    // survive a customer logging out mid-flow.
    delete session.userId;
  }

  async me(session: RequestSession): Promise<SafeUser> {
    if (!session.userId) {
      throw new UnauthorizedException('Login required.');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user) {
      // Account was deleted after the session was issued - treat as logged out.
      delete session.userId;
      throw new UnauthorizedException('Login required.');
    }
    return toSafeUser(user);
  }

  private startSession(session: RequestSession, userId: string): void {
    session.userId = userId;
    // Extends this session's Redis TTL (see RedisSessionStore) far beyond the
    // short-lived anonymous booking-session default - a logged-in customer
    // shouldn't be signed out after 30 minutes of browsing.
    if (session.cookie) {
      session.cookie.maxAge = this.sessionTtlMs;
    }
  }
}
