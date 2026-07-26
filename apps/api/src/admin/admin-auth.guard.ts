import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

/** Guards every promotion-mutating route - the public GET /promotions list stays unguarded. */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.session.isAdmin) {
      throw new UnauthorizedException('Admin login required.');
    }
    return true;
  }
}
