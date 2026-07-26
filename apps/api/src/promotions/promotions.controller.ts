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
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { ReorderPromotionsDto } from './dto/reorder-promotions.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';
import { PromotionsService } from './promotions.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Controller()
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // Public - powers the homepage promotions banner. No auth.
  @Get('promotions')
  listActive() {
    return this.promotionsService.listActive();
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/promotions')
  listAll() {
    return this.promotionsService.listAll();
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/promotions')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotionsService.create(file, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/promotions/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotionsService.update(id, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('admin/promotions/:id')
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }

  @UseGuards(AdminAuthGuard)
  @Put('admin/promotions/reorder')
  reorder(@Body() dto: ReorderPromotionsDto) {
    return this.promotionsService.reorder(dto.orderedIds);
  }
}
