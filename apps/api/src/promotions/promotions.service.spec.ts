import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as blob from '@vercel/blob';
import type { PrismaService } from '../prisma/prisma.service';
import { PromotionsService } from './promotions.service';

jest.mock('@vercel/blob', () => ({
  put: jest.fn(),
  del: jest.fn(),
}));

function buildPrisma() {
  return {
    promotion: {
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
  originalname: 'poster.jpg',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('fake-image-bytes'),
} as Express.Multer.File;

describe('PromotionsService.create', () => {
  beforeEach(() => jest.clearAllMocks());

  it('uploads to Vercel Blob and creates a Promotion row with the next sortOrder', async () => {
    const prisma = buildPrisma();
    (prisma.promotion.aggregate as jest.Mock).mockResolvedValue({
      _max: { sortOrder: 2 },
    });
    (blob.put as jest.Mock).mockResolvedValue({
      url: 'https://blob.example/promotions/poster.jpg',
    });
    const service = new PromotionsService(prisma, buildConfig());

    const result = await service.create(fakeFile, {
      title: 'Ramadan Umrah offer',
    });

    expect(blob.put).toHaveBeenCalledWith(
      expect.stringContaining('promotions/'),
      fakeFile.buffer,
      expect.objectContaining({
        access: 'public',
        contentType: 'image/jpeg',
        token: 'blob-token',
      }),
    );
    expect(prisma.promotion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        title: 'Ramadan Umrah offer',
        imageUrl: 'https://blob.example/promotions/poster.jpg',
        sortOrder: 3,
      }),
    });
    expect(result).toMatchObject({
      title: 'Ramadan Umrah offer',
      sortOrder: 3,
    });
  });

  it('defaults sortOrder to 0 for the first promotion', async () => {
    const prisma = buildPrisma();
    (blob.put as jest.Mock).mockResolvedValue({
      url: 'https://blob.example/x.jpg',
    });
    const service = new PromotionsService(prisma, buildConfig());

    await service.create(fakeFile, {});

    expect(prisma.promotion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sortOrder: 0 }),
      }),
    );
  });

  it('rejects when no file is provided', async () => {
    const service = new PromotionsService(buildPrisma(), buildConfig());

    await expect(service.create(undefined, {})).rejects.toThrow(
      BadRequestException,
    );
    expect(blob.put).not.toHaveBeenCalled();
  });

  it('rejects with a clear message when BLOB_READ_WRITE_TOKEN is not configured', async () => {
    const service = new PromotionsService(buildPrisma(), buildConfig(''));

    await expect(service.create(fakeFile, {})).rejects.toThrow(
      BadRequestException,
    );
    expect(blob.put).not.toHaveBeenCalled();
  });
});

describe('PromotionsService.remove', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deletes the blob (best-effort) and the row', async () => {
    const prisma = buildPrisma();
    (prisma.promotion.findUnique as jest.Mock).mockResolvedValue({
      id: 'promo-1',
      imageUrl: 'https://blob.example/promo-1.jpg',
    });
    const service = new PromotionsService(prisma, buildConfig());

    await service.remove('promo-1');

    expect(blob.del).toHaveBeenCalledWith('https://blob.example/promo-1.jpg', {
      token: 'blob-token',
    });
    expect(prisma.promotion.delete).toHaveBeenCalledWith({
      where: { id: 'promo-1' },
    });
  });

  it('still deletes the row even if blob deletion fails', async () => {
    const prisma = buildPrisma();
    (prisma.promotion.findUnique as jest.Mock).mockResolvedValue({
      id: 'promo-1',
      imageUrl: 'https://blob.example/promo-1.jpg',
    });
    (blob.del as jest.Mock).mockRejectedValue(
      new Error('blob store unreachable'),
    );
    const service = new PromotionsService(prisma, buildConfig());

    await service.remove('promo-1');

    expect(prisma.promotion.delete).toHaveBeenCalledWith({
      where: { id: 'promo-1' },
    });
  });

  it('throws NotFoundException for an unknown id', async () => {
    const prisma = buildPrisma();
    (prisma.promotion.findUnique as jest.Mock).mockResolvedValue(null);
    const service = new PromotionsService(prisma, buildConfig());

    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
    expect(blob.del).not.toHaveBeenCalled();
  });
});

describe('PromotionsService.reorder', () => {
  it('updates sortOrder for each id in a single transaction', async () => {
    const prisma = buildPrisma();
    const service = new PromotionsService(prisma, buildConfig());

    await service.reorder(['c', 'a', 'b']);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.promotion.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'c' },
      data: { sortOrder: 0 },
    });
    expect(prisma.promotion.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'a' },
      data: { sortOrder: 1 },
    });
    expect(prisma.promotion.update).toHaveBeenNthCalledWith(3, {
      where: { id: 'b' },
      data: { sortOrder: 2 },
    });
  });
});
