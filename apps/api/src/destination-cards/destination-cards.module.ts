import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { DestinationCardsController } from './destination-cards.controller';
import { DestinationCardsService } from './destination-cards.service';

@Module({
  imports: [AdminModule],
  controllers: [DestinationCardsController],
  providers: [DestinationCardsService],
})
export class DestinationCardsModule {}
