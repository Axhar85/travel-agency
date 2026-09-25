import { Module } from '@nestjs/common';
import { GdsModule } from '../gds/gds.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [GdsModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
