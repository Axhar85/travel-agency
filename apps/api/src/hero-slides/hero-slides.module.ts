import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { HeroSlidesController } from './hero-slides.controller';
import { HeroSlidesService } from './hero-slides.service';

@Module({
  imports: [AdminModule],
  controllers: [HeroSlidesController],
  providers: [HeroSlidesService],
})
export class HeroSlidesModule {}
