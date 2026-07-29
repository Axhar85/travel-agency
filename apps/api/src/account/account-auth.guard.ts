import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/** Guards routes that require a logged-in customer (e.g. GET /account/bookings). */
@Injectable()
export class AccountAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.session.userId) {
      throw new UnauthorizedException('Login required.');
    }
    return true;
  }
}
