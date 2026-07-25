// Payment state lives in its own Redis record keyed by Stripe PaymentIntent
// id - NOT inside the express-session. Stripe's webhook calls this API
// server-to-server with no session cookie, so it can never touch
// req.session; this record is the only place both the webhook and the
// cookie-bound booking endpoints can agree on the current payment state.
// Booking session only stores the paymentIntentId pointer (see
// BookingSessionData.payment in ../booking/booking-session.types.ts).
export type PaymentStatus =
  'requires_payment' | 'requires_action' | 'authorized' | 'canceled' | 'failed';

export interface PaymentRecord {
  paymentIntentId: string;
  bookingSessionId: string;
  amountMinorUnits: number;
  currency: string;
  status: PaymentStatus;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}
