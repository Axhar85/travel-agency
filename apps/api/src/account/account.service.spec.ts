import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { RequestSession } from '../booking/booking-session.types';
import { AccountLoginRateLimiter } from './account-login-rate-limiter.service';
import { AccountService } from './account.service';

function buildSession(): RequestSession {
  return { cookie: { maxAge: 1_800_000 } } as unknown as RequestSession;
}

function buildRateLimiter(allowed = true) {
  return {
    isAllowed: jest.fn().mockResolvedValue(allowed),
    recordFailure: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
  } as unknown as AccountLoginRateLimiter;
}

function buildConfig() {
  return { get: () => 2_592_000 } as unknown as ConfigService;
}

function buildPrisma(users: Record<string, any> = {}) {
  return {
    user: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id) return users[where.id] ?? null;
        if (where.email) {
          return Object.values(users).find((u: any) => u.email === where.email) ?? null;
        }
        return null;
      }),
      create: jest.fn(async ({ data }: any) => {
        const user = { id: 'new-user-id', ...data };
        users[user.id] = user;
        return user;
      }),
    },
  } as any;
}

describe('AccountService.register', () => {
  it('creates a user, hashes the password, and starts the session', async () => {
    const prisma = buildPrisma();
    const service = new AccountService(prisma, buildRateLimiter(), buildConfig());
    const session = buildSession();

    const user = await service.register(session, {
      email: 'new@example.com',
      password: 'longenough',
    } as any);

    expect(user.email).toBe('new@example.com');
    expect((user as any).passwordHash).toBeUndefined();
    expect(session.userId).toBe('new-user-id');
    expect(session.cookie!.maxAge).toBe(2_592_000_000);
    const created = await prisma.user.findUnique({ where: { id: 'new-user-id' } });
    expect(await bcrypt.compare('longenough', created.passwordHash)).toBe(true);
  });

  it('rejects a duplicate email', async () => {
    const prisma = buildPrisma({
      existing: { id: 'existing', email: 'dup@example.com', passwordHash: 'x' },
    });
    const service = new AccountService(prisma, buildRateLimiter(), buildConfig());

    await expect(
      service.register(buildSession(), {
        email: 'dup@example.com',
        password: 'longenough',
      } as any),
    ).rejects.toThrow(ConflictException);
  });
});

describe('AccountService.login', () => {
  it('sets session.userId on correct credentials and resets the rate limiter', async () => {
    const passwordHash = await bcrypt.hash('correct-horse', 10);
    const prisma = buildPrisma({
      u1: { id: 'u1', email: 'a@example.com', passwordHash, firstName: null, lastName: null },
    });
    const rateLimiter = buildRateLimiter();
    const service = new AccountService(prisma, rateLimiter, buildConfig());
    const session = buildSession();

    await service.login(session, 'a@example.com', 'correct-horse', '1.2.3.4');

    expect(session.userId).toBe('u1');
    expect(rateLimiter.reset).toHaveBeenCalledWith('1.2.3.4');
  });

  it('rejects an incorrect password without revealing the account exists', async () => {
    const passwordHash = await bcrypt.hash('correct-horse', 10);
    const prisma = buildPrisma({
      u1: { id: 'u1', email: 'a@example.com', passwordHash, firstName: null, lastName: null },
    });
    const rateLimiter = buildRateLimiter();
    const service = new AccountService(prisma, rateLimiter, buildConfig());

    await expect(
      service.login(buildSession(), 'a@example.com', 'wrong', '1.2.3.4'),
    ).rejects.toThrow(UnauthorizedException);
    expect(rateLimiter.recordFailure).toHaveBeenCalledWith('1.2.3.4');
  });

  it('rejects an unknown email with the same generic message', async () => {
    const prisma = buildPrisma();
    const rateLimiter = buildRateLimiter();
    const service = new AccountService(prisma, rateLimiter, buildConfig());

    await expect(
      service.login(buildSession(), 'nobody@example.com', 'whatever', '1.2.3.4'),
    ).rejects.toThrow(UnauthorizedException);
    expect(rateLimiter.recordFailure).toHaveBeenCalledWith('1.2.3.4');
  });

  it('rejects before checking the password once the IP is rate-limited', async () => {
    const prisma = buildPrisma();
    const rateLimiter = buildRateLimiter(false);
    const service = new AccountService(prisma, rateLimiter, buildConfig());

    await expect(
      service.login(buildSession(), 'a@example.com', 'whatever', '1.2.3.4'),
    ).rejects.toThrow(UnauthorizedException);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe('AccountService.logout', () => {
  it('clears only session.userId, leaving an in-progress booking untouched', () => {
    const service = new AccountService(buildPrisma(), buildRateLimiter(), buildConfig());
    const session = buildSession();
    session.userId = 'u1';
    (session as any).booking = { step: 'passengers' };

    service.logout(session);

    expect(session.userId).toBeUndefined();
    expect((session as any).booking).toEqual({ step: 'passengers' });
  });
});
