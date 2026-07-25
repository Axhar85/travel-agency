import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { PaymentRecord } from './payment-record.types';

const KEY_PREFIX = 'payment:';

/**
 * Unlike SearchService's Redis cache, this is the source of truth for
 * payment state, not a performance optimization - a Redis failure here must
 * fail the request loudly (never silently continue as if nothing was
 * recorded), since that's exactly the kind of silent bug CLAUDE.md flags
 * payments/booking as unable to afford.
 */
@Injectable()
export class PaymentRecordRepository {
  private readonly ttlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.ttlSeconds = config.get<number>('PAYMENT_RECORD_TTL_SECONDS', 172_800);
  }

  async get(paymentIntentId: string): Promise<PaymentRecord | null> {
    const raw = await this.redis.get(KEY_PREFIX + paymentIntentId);
    return raw ? (JSON.parse(raw) as PaymentRecord) : null;
  }

  async save(record: PaymentRecord): Promise<void> {
    await this.redis.set(
      KEY_PREFIX + record.paymentIntentId,
      JSON.stringify(record),
      'EX',
      this.ttlSeconds,
    );
  }
}
