import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import type Redis from 'ioredis';
import { AmadeusExceptionFilter } from './amadeus/filters/amadeus-exception.filter';
import { AppModule } from './app.module';
import { PaymentsExceptionFilter } from './payments/filters/payments-exception.filter';
import { REDIS_CLIENT } from './redis/redis.constants';
import { RedisSessionStore } from './session/redis-session.store';

async function bootstrap() {
  // rawBody: true preserves the raw request buffer alongside the normally
  // parsed body - the Stripe webhook needs the exact raw bytes to verify
  // the signature, which parsing-then-reserializing cannot reproduce.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  const config = app.get(ConfigService);
  const isProduction = config.get<string>('NODE_ENV') === 'production';

  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN'),
    credentials: true,
  });

  if (isProduction) {
    // Required for secure cookies to work correctly behind a reverse proxy/load balancer.
    app.set('trust proxy', 1);
  }

  const redis = app.get<Redis>(REDIS_CLIENT);
  const bookingSessionTtlSeconds = config.get<number>(
    'BOOKING_SESSION_TTL_SECONDS',
    1800,
  );
  app.use(
    session({
      store: new RedisSessionStore(redis, bookingSessionTtlSeconds),
      secret: config.getOrThrow<string>('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      name: 'malik.sid',
      cookie: {
        httpOnly: true,
        secure: isProduction,
        // localhost:3000 and localhost:4000 are same-site (SameSite only
        // considers scheme + registrable domain, not port), so 'lax' works
        // for the cross-port dev setup without needing SameSite=None+Secure
        // (which would require HTTPS even in local dev). A real deployment
        // (e.g. frontend on Netlify, API on Render) puts the two apps on
        // different registrable domains - that's cross-SITE, not just
        // cross-port, and 'lax' blocks the cookie on the fetch()-with-
        // credentials calls this app relies on for login/booking/admin.
        // 'none' (paired with secure:true, which HTTPS-terminating hosts
        // like Render/Netlify provide by default) is required for that.
        sameSite: isProduction ? 'none' : 'lax',
        maxAge: bookingSessionTtlSeconds * 1000,
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(
    new AmadeusExceptionFilter(),
    new PaymentsExceptionFilter(),
  );

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
}
void bootstrap();
