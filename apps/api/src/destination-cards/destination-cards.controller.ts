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
import { CreateDestinationCardDto } from './dto/create-destination-card.dto';
import { ReorderDestinationCardsDto } from './dto/reorder-destination-cards.dto';
import { UpdateDestinationCardDto } from './dto/update-destination-card.dto';
import { DestinationCardsService } from './destination-cards.service';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

@Controller()
export class DestinationCardsController {
  constructor(private readonly destinationCardsService: DestinationCardsService) {}

  // Public - powers the homepage destination cards. No auth.
  @Get('destination-cards')
  listActive() {
    return this.destinationCardsService.listActive();
  }

  @UseGuards(AdminAuthGuard)
  @Get('admin/destination-cards')
  listAll() {
    return this.destinationCardsService.listAll();
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/destination-cards')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES },
    }),
  )
  create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateDestinationCardDto,
  ) {
    return this.destinationCardsService.create(file, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Patch('admin/destination-cards/:id')
  update(@Param('id') id: string, @Body() dto: UpdateDestinationCardDto) {
    return this.destinationCardsService.update(id, dto);
  }

  @UseGuards(AdminAuthGuard)
  @Delete('admin/destination-cards/:id')
  remove(@Param('id') id: string) {
    return this.destinationCardsService.remove(id);
  }

  @UseGuards(AdminAuthGuard)
  @Put('admin/destination-cards/reorder')
  reorder(@Body() dto: ReorderDestinationCardsDto) {
    return this.destinationCardsService.reorder(dto.orderedIds);
  }
}
