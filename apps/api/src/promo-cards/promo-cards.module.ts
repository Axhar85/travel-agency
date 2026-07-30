import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { PromoCardsController } from './promo-cards.controller';
import { PromoCardsService } from './promo-cards.service';

@Module({
  imports: [AdminModule],
  controllers: [PromoCardsController],
  providers: [PromoCardsService],
})
export class PromoCardsModule {}
