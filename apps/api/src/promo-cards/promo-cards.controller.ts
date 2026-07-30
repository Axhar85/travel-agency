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
import { CreatePromoCardDto } from './dto/create-promo-card.dto';
import { ReorderPromoCardsDto } from './dto/reorder-promo-cards.dto';
import { UpdatePromoCardDto } from './dto/update-promo-card.dto';
import { PromoCardsService } from './promo-cards.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Controller()
export class PromoCardsController {
  constructor(private readonly promoCardsService: PromoCardsService) {}

  // Public - powers the homepage promo cards section. No auth.
  @Get('promo-cards')
  listActive() {
    return this.promoCardsService.listActive();
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/promo-cards')
  listAll() {
    return this.promoCardsService.listAll();
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/promo-cards')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreatePromoCardDto,
  ) {
    return this.promoCardsService.create(file, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/promo-cards/:id')
  update(@Param('id') id: string, @Body() dto: UpdatePromoCardDto) {
    return this.promoCardsService.update(id, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('admin/promo-cards/:id')
  remove(@Param('id') id: string) {
    return this.promoCardsService.remove(id);
  }

  @UseGuards(AdminAuthGuard)
  @Put('admin/promo-cards/reorder')
  reorder(@Body() dto: ReorderPromoCardsDto) {
    return this.promoCardsService.reorder(dto.orderedIds);
  }
}
