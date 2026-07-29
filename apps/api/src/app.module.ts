import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountModule } from './account/account.module';
import { AdminModule } from './admin/admin.module';
import { AmadeusModule } from './amadeus/amadeus.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookingModule } from './booking/booking.module';
import { validateEnv } from './config/env.validation';
import { DestinationCardsModule } from './destination-cards/destination-cards.module';
import { HealthModule } from './health/health.module';
import { HeroSlidesModule } from './hero-slides/hero-slides.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { PromotionsModule } from './promotions/promotions.module';
import { RedisModule } from './redis/redis.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    RedisModule,
    AmadeusModule,
    HealthModule,
    SearchModule,
    PaymentsModule,
    BookingModule,
    AdminModule,
    PromotionsModule,
    AccountModule,
    HeroSlidesModule,
    DestinationCardsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
