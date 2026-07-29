import { Injectable } from '@nestjs/common';
import type { BookingRecordStatus, Prisma } from '@prisma/client';
import { toStripeMinorUnits } from '../payments/currency-minor-units';
import { PrismaService } from '../prisma/prisma.service';
import { BookingSessionData } from './booking-session.types';

/**
 * Durable record of a booking, written once (see BookingService.getState)
 * as the Redis-backed session reaches payment_authorized or payment_failed.
 * Deliberately does NOT claim "confirmed"/"ticketed" - real GDS order
 * creation + payment capture aren't implemented yet.
 */
@Injectable()
export class BookingRecordRepository {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromSession(
    userId: string | undefined,
    booking: BookingSessionData,
    status: BookingRecordStatus,
  ): Promise<void> {
    const paymentIntentId = booking.payment?.paymentIntentId;
    if (!paymentIntentId) return; // caller only invokes this once payment exists

    const totalAmountMinor = toStripeMinorUnits(
      booking.pricedOffer.price.total,
      booking.pricedOffer.price.currency,
    );
    const currency = booking.pricedOffer.price.currency;
    const offerSnapshot = booking.pricedOffer as unknown as Prisma.InputJsonValue;
    const passengers = booking.passengers as unknown as Prisma.InputJsonValue;

    await this.prisma.booking.upsert({
      where: { paymentIntentId },
      create: {
        paymentIntentId,
        userId,
        status,
        offerSnapshot,
        passengers,
        totalAmountMinor,
        currency,
      },
      update: {
        userId,
        status,
        offerSnapshot,
        passengers,
        totalAmountMinor,
        currency,
      },
    });
  }

  findByUserId(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
