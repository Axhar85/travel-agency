import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as blob from '@vercel/blob';
import type { PrismaService } from '../prisma/prisma.service';
import { PromoCardsService } from './promo-cards.service';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

function buildPrisma() {
  return {
    promoCard: {
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
  originalname: 'card.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-image-bytes'),
} as Express.Multer.File;

const dto = {
  titleEs: 'Titulo',
  titleEn: 'Title',
  subtitleEs: 'Subtitulo',
  subtitleEn: 'Subtitle',
  linkUrl: '/search?origin=MAD&destination=LHE',
};

describe('PromoCardsService.create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads to Vercel Blob and creates a PromoCard row with the next sortOrder', async () => {
    const prisma = buildPrisma();
    (prisma.promoCard.aggregate as jest.Mock).mockResolvedValue({
      _max: { sortOrder: 3 },
    });
    (blob.put as jest.Mock).mockResolvedValue({
      url: 'https://blob.example/promo-cards/card.jpg',
    });
    const service = new PromoCardsService(prisma, buildConfig());

    const result = await service.create(fakeFile, dto);

    expect(blob.put).toHaveBeenCalledWith(
      expect.stringContaining('promo-cards/'),
      fakeFile.buffer,
      expect.objectContaining({ access: 'public', token: 'blob-token' }),
    );
    expect(prisma.promoCard.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ ...dto, sortOrder: 4 }),
    });
    expect(result).toMatchObject({ titleEs: 'Titulo', sortOrder: 4 });
  });

  it('rejects when no file is provided', async () => {
    const service = new PromoCardsService(buildPrisma(), buildConfig());

    await expect(service.create(undefined, dto)).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('PromoCardsService.remove', () => {
  it('throws NotFoundException for an unknown id', async () => {
    const prisma = buildPrisma();
    (prisma.promoCard.findUnique as jest.Mock).mockResolvedValue(null);
    const service = new PromoCardsService(prisma, buildConfig());

    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});

describe('PromoCardsService.reorder', () => {
  it('updates sortOrder for each id in a single transaction', async () => {
    const prisma = buildPrisma();
    const service = new PromoCardsService(prisma, buildConfig());

    await service.reorder(['b', 'a']);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.promoCard.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'b' },
      data: { sortOrder: 0 },
    });
  });
});
