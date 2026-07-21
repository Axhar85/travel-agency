import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import session from 'express-session';
import type Redis from 'ioredis';
import { AmadeusExceptionFilter } from './amadeus/filters/amadeus-exception.filter';
import { AppModule } from './app.module';
import { REDIS_CLIENT } from './redis/redis.constants';
import { RedisSessionStore } from './session/redis-session.store';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
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
        // (which would require HTTPS even in local dev).
        sameSite: 'lax',
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
  app.useGlobalFilters(new AmadeusExceptionFilter());

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
}
void bootstrap();
