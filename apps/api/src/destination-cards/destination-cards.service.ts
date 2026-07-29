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
import { CreateDestinationCardDto } from './dto/create-destination-card.dto';
import { UpdateDestinationCardDto } from './dto/update-destination-card.dto';

@Injectable()
export class DestinationCardsService {
  private readonly logger = new Logger(DestinationCardsService.name);
  private readonly blobToken: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.blobToken = config.get<string>('BLOB_READ_WRITE_TOKEN', '');
  }

  listActive() {
    return this.prisma.destinationCard.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  listAll() {
    return this.prisma.destinationCard.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async create(
    file: Express.Multer.File | undefined,
    dto: CreateDestinationCardDto,
  ) {
    if (!file) {
      throw new BadRequestException('An image file is required.');
    }
    if (!this.blobToken) {
      throw new BadRequestException(
        'Image storage is not configured yet (BLOB_READ_WRITE_TOKEN is missing).',
      );
    }

    const blob = await put(
      `destination-cards/${randomUUID()}-${file.originalname}`,
      file.buffer,
      {
        access: 'public',
        contentType: file.mimetype,
        token: this.blobToken,
      },
    );

    const { _max } = await this.prisma.destinationCard.aggregate({
      _max: { sortOrder: true },
    });

    return this.prisma.destinationCard.create({
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

  async update(id: string, dto: UpdateDestinationCardDto) {
    await this.getOrThrow(id);
    return this.prisma.destinationCard.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    const card = await this.getOrThrow(id);

    try {
      await del(card.imageUrl, { token: this.blobToken });
    } catch (error) {
      this.logger.error(
        `Failed to delete blob for destination card ${id}, continuing: ${(error as Error).message}`,
      );
    }

    await this.prisma.destinationCard.delete({ where: { id } });
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, index) =>
        this.prisma.destinationCard.update({
          where: { id },
          data: { sortOrder: index },
        }),
      ),
    );
  }

  private async getOrThrow(id: string) {
    const card = await this.prisma.destinationCard.findUnique({ where: { id } });
    if (!card) {
      throw new NotFoundException('Destination card not found.');
    }
    return card;
  }
}
