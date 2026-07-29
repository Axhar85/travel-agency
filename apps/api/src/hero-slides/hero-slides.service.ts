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
import { CreateHeroSlideDto } from './dto/create-hero-slide.dto';
import { UpdateHeroSlideDto } from './dto/update-hero-slide.dto';

@Injectable()
export class HeroSlidesService {
  private readonly logger = new Logger(HeroSlidesService.name);
  private readonly blobToken: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.blobToken = config.get<string>('BLOB_READ_WRITE_TOKEN', '');
  }

  listActive() {
    return this.prisma.heroSlide.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  listAll() {
    return this.prisma.heroSlide.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async create(file: Express.Multer.File | undefined, dto: CreateHeroSlideDto) {
    if (!file) {
      throw new BadRequestException('An image file is required.');
    }
    if (!this.blobToken) {
      throw new BadRequestException(
        'Image storage is not configured yet (BLOB_READ_WRITE_TOKEN is missing).',
      );
    }

    const blob = await put(
      `hero-slides/${randomUUID()}-${file.originalname}`,
      file.buffer,
      {
        access: 'public',
        contentType: file.mimetype,
        token: this.blobToken,
      },
    );

    const { _max } = await this.prisma.heroSlide.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.heroSlide.create({
      data: {
        titleEs: dto.titleEs,
        titleEn: dto.titleEn,
        subtitleEs: dto.subtitleEs,
        subtitleEn: dto.subtitleEn,
        linkUrl: dto.linkUrl,
        imageUrl: blob.url,
        sortOrder: (_max.sortOrder ?? -1) + 1,
      },
    });
  }

  async update(id: string, dto: UpdateHeroSlideDto) {
    await this.getOrThrow(id);
    return this.prisma.heroSlide.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const slide = await this.getOrThrow(id);

    try {
      await del(slide.imageUrl, { token: this.blobToken });
    } catch (error) {
      this.logger.error(
        `Failed to delete blob for hero slide ${id}, continuing: ${(error as Error).message}`,
      );
    }

    await this.prisma.heroSlide.delete({ where: { id } });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.heroSlide.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  private async getOrThrow(id: string) {
    const slide = await this.prisma.heroSlide.findUnique({ where: { id } });
    if (!slide) {
      throw new NotFoundException('Hero slide not found.');
    }
    return slide;
  }
}
