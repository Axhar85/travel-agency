import { ConfigService } from '@nestjs/config';
import { PaymentRecordRepository } from './payment-record.repository';
import { PaymentRecord } from './payment-record.types';

const record: PaymentRecord = {
  paymentIntentId: 'pi_123',
  bookingSessionId: 'sess_abc',
  amountMinorUnits: 45_000,
  currency: 'EUR',
  status: 'requires_payment',
  createdAt: '2026-07-24T00:00:00.000Z',
  updatedAt: '2026-07-24T00:00:00.000Z',
};

describe('PaymentRecordRepository', () => {
  it('stores a record and reads it back under a prefixed key with the configured TTL', async () => {
    const store = new Map<string, string>();
    const redis = {
      set: jest.fn(async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      }),
      get: jest.fn(async (key: string) => store.get(key) ?? null),
    } as any;
    const config = { get: () => 691_200 } as unknown as ConfigService;
    const repo = new PaymentRecordRepository(redis, config);

    await repo.save(record);
    const retrieved = await repo.get('pi_123');

    expect(retrieved).toEqual(record);
    expect(redis.set).toHaveBeenCalledWith(
      'payment:pi_123',
      JSON.stringify(record),
      'EX',
      691_200,
    );
  });

  it('returns null for an unknown payment intent id', async () => {
    const redis = { set: jest.fn(), get: jest.fn(async () => null) } as any;
    const config = { get: () => 691_200 } as unknown as ConfigService;
    const repo = new PaymentRecordRepository(redis, config);

    expect(await repo.get('does-not-exist')).toBeNull();
  });
});
