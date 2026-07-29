import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as blob from '@vercel/blob';
import type { PrismaService } from '../prisma/prisma.service';
import { HeroSlidesService } from './hero-slides.service';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

function buildPrisma() {
  return {
    heroSlide: {
      findMany: jest.fn(),
      aggregate: jest.fn().mockResolvedValue({ _max: { sortOrder: null } }),
      create: jest.fn((args: any) => ({ id: 'new-id', ...args.data })),
      update: jest.fn((args: any) => ({ id: args.where.id, ...args.data })),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  } as unknown as PrismaService;
}

function buildConfig(token = 'blob-token'): ConfigService {
  return { get: () => token } as unknown as ConfigService;
}

const fakeFile = {
  originalname: 'slide.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-image-bytes'),
} as Express.Multer.File;

const dto = {
  titleEs: 'Titulo',
  titleEn: 'Title',
  subtitleEs: 'Subtitulo',
  subtitleEn: 'Subtitle',
  linkUrl: '/hajj-umrah',
};

describe('HeroSlidesService.create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads to Vercel Blob and creates a HeroSlide row with the next sortOrder', async () => {
    const prisma = buildPrisma();
    (prisma.heroSlide.aggregate as jest.Mock).mockResolvedValue({
      _max: { sortOrder: 1 },
    });
    (blob.put as jest.Mock).mockResolvedValue({
      url: 'https://blob.example/hero-slides/slide.jpg',
    });
    const service = new HeroSlidesService(prisma, buildConfig());

    const result = await service.create(fakeFile, dto);

    expect(blob.put).toHaveBeenCalledWith(
      expect.stringContaining('hero-slides/'),
      fakeFile.buffer,
      expect.objectContaining({ access: 'public', token: 'blob-token' }),
    );
    expect(prisma.heroSlide.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...dto, sortOrder: 2 }),
    });
    expect(result).toMatchObject({ titleEs: 'Titulo', sortOrder: 2 });
  });

  it('rejects when no file is provided', async () => {
    const service = new HeroSlidesService(buildPrisma(), buildConfig());

    await expect(service.create(undefined, dto)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects with a clear message when BLOB_READ_WRITE_TOKEN is not configured', async () => {
    const service = new HeroSlidesService(buildPrisma(), buildConfig(''));

    await expect(service.create(fakeFile, dto)).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('HeroSlidesService.remove', () => {
  it('throws NotFoundException for an unknown id', async () => {
    const prisma = buildPrisma();
    (prisma.heroSlide.findUnique as jest.Mock).mockResolvedValue(null);
    const service = new HeroSlidesService(prisma, buildConfig());

    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});

describe('HeroSlidesService.reorder', () => {
  it('updates sortOrder for each id in a single transaction', async () => {
    const prisma = buildPrisma();
    const service = new HeroSlidesService(prisma, buildConfig());

    await service.reorder(['b', 'a']);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.heroSlide.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'b' },
      data: { sortOrder: 0 },
    });
    expect(prisma.heroSlide.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'a' },
      data: { sortOrder: 1 },
    });
  });
});
