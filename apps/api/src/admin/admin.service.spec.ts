import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import type { RequestSession } from '../booking/booking-session.types';
import { AdminLoginRateLimiter } from './admin-login-rate-limiter.service';
import { AdminService } from './admin.service';

function buildSession(): RequestSession {
  return {} as unknown as RequestSession;
}

function buildRateLimiter(allowed = true) {
  return {
    isAllowed: jest.fn().mockResolvedValue(allowed),
    recordFailure: jest.fn().mockResolvedValue(undefined),
    reset: jest.fn().mockResolvedValue(undefined),
  } as unknown as AdminLoginRateLimiter;
}

describe('AdminService.login', () => {
  it('sets session.isAdmin and resets the rate limiter on a correct password', async () => {
    const hash = await bcrypt.hash('correct-horse', 10);
    const config = { get: () => hash } as unknown as ConfigService;
    const rateLimiter = buildRateLimiter();
    const service = new AdminService(config, rateLimiter);
    const session = buildSession();

    await service.login(session, 'correct-horse', '1.2.3.4');

    expect(session.isAdmin).toBe(true);
    expect(rateLimiter.reset).toHaveBeenCalledWith('1.2.3.4');
  });

  it('rejects an incorrect password and records the failure', async () => {
    const hash = await bcrypt.hash('correct-horse', 10);
    const config = { get: () => hash } as unknown as ConfigService;
    const rateLimiter = buildRateLimiter();
    const service = new AdminService(config, rateLimiter);
    const session = buildSession();

    await expect(
      service.login(session, 'wrong-password', '1.2.3.4'),
    ).rejects.toThrow(UnauthorizedException);
    expect(session.isAdmin).toBeUndefined();
    expect(rateLimiter.recordFailure).toHaveBeenCalledWith('1.2.3.4');
  });

  it('always rejects when no password hash is configured yet', async () => {
    const config = { get: () => '' } as unknown as ConfigService;
    const rateLimiter = buildRateLimiter();
    const service = new AdminService(config, rateLimiter);

    await expect(
      service.login(buildSession(), 'anything', '1.2.3.4'),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects before checking the password once the IP is rate-limited', async () => {
    const hash = await bcrypt.hash('correct-horse', 10);
    const config = { get: () => hash } as unknown as ConfigService;
    const rateLimiter = buildRateLimiter(false);
    const service = new AdminService(config, rateLimiter);

    await expect(
      service.login(buildSession(), 'correct-horse', '1.2.3.4'),
    ).rejects.toThrow(UnauthorizedException);
    expect(rateLimiter.recordFailure).not.toHaveBeenCalled();
  });
});
