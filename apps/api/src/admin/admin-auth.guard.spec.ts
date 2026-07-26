import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';

function buildContext(session: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ session }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminAuthGuard', () => {
  const guard = new AdminAuthGuard();

  it('allows the request through when session.isAdmin is true', () => {
    expect(guard.canActivate(buildContext({ isAdmin: true }))).toBe(true);
  });

  it('rejects when session.isAdmin is not set', () => {
    expect(() => guard.canActivate(buildContext({}))).toThrow(
      UnauthorizedException,
    );
  });

  it('rejects when session.isAdmin is explicitly false', () => {
    expect(() => guard.canActivate(buildContext({ isAdmin: false }))).toThrow(
      UnauthorizedException,
    );
  });
});
