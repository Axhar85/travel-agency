import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { del, put } from '@vercel/blob';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { UpdatePromotionDto } from './dto/update-promotion.dto';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);
  private readonly blobToken: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.blobToken = config.get<string>('BLOB_READ_WRITE_TOKEN', '');
  }

  listActive() {
    return this.prisma.promotion.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  listAll() {
    return this.prisma.promotion.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async create(file: Express.Multer.File | undefined, dto: CreatePromotionDto) {
    if (!file) {
      throw new BadRequestException('An image file is required.');
    }
    if (!this.blobToken) {
      // Same "fail loudly at call time, not at boot" pattern as Amadeus/Stripe.
      throw new BadRequestException(
        'Image storage is not configured yet (BLOB_READ_WRITE_TOKEN is missing).',
      );
    }

    const blob = await put(
      `promotions/${randomUUID()}-${file.originalname}`,
      file.buffer,
      {
        access: 'public',
        contentType: file.mimetype,
        token: this.blobToken,
      },
    );

    const { _max } = await this.prisma.promotion.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.promotion.create({
      data: {
        title: dto.title,
        linkUrl: dto.linkUrl,
        imageUrl: blob.url,
        sortOrder: (_max.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(id: string, dto: UpdatePromotionDto) {
    await this.getOrThrow(id);
    return this.prisma.promotion.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const promotion = await this.getOrThrow(id);

    // Best-effort - an orphaned blob wastes storage but breaks nothing, so a
    // cleanup failure shouldn't block deleting the (already-broken-looking)
    // promotion row itself.
    try {
      await del(promotion.imageUrl, { token: this.blobToken });
    } catch (error) {
      this.logger.error(
        `Failed to delete blob for promotion ${id}, continuing: ${(error as Error).message}`,
      );
    }

    await this.prisma.promotion.delete({ where: { id } });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.promotion.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  private async getOrThrow(id: string) {
    const promotion = await this.prisma.promotion.findUnique({ where: { id } });
    if (!promotion) {
      throw new NotFoundException('Promotion not found.');
    }
    return promotion;
  }
}
