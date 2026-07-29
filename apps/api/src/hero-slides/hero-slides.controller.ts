import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AdminAuthGuard } from '../admin/admin-auth.guard';
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { ReorderHeroSlidesDto } from './dto/reorder-hero-slides.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';
import { HeroSlidesService } from './hero-slides.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Controller()
export class HeroSlidesController {
  constructor(private readonly heroSlidesService: HeroSlidesService) {}

  // Public - powers the homepage hero carousel. No auth.
  @Get('hero-slides')
  listActive() {
    return this.heroSlidesService.listActive();
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/hero-slides')
  listAll() {
    return this.heroSlidesService.listAll();
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/hero-slides')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateHeroSlideDto,
  ) {
    return this.heroSlidesService.create(file, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/hero-slides/:id')
  update(@Param('id') id: string, @Body() dto: UpdateHeroSlideDto) {
    return this.heroSlidesService.update(id, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('admin/hero-slides/:id')
  remove(@Param('id') id: string) {
    return this.heroSlidesService.remove(id);
  }

  @UseGuards(AdminAuthGuard)
  @Put('admin/hero-slides/reorder')
  reorder(@Body() dto: ReorderHeroSlidesDto) {
    return this.heroSlidesService.reorder(dto.orderedIds);
  }
}
