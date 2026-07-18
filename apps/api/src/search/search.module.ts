import { Module } from '@nestjs/common';
import { AmadeusModule } from '../amadeus/amadeus.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [AmadeusModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
