import type { Request } from 'express';
import type {
  Passenger,
  PricedOffer,
} from '../amadeus/interfaces/gds-client.interface';

// `Session` alone (from express-session) doesn't include SessionData's
// fields - express's own type declares req.session as the intersection
// `Session & Partial<SessionData>`, so that's the type to use wherever a
// session parameter needs access to booking-specific fields.
export type RequestSession = Request['session'];

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
}

export type BookingStep =
  'passengers' | 'review' | 'payment' | 'payment_authorized' | 'payment_failed';

// Only a pointer into PaymentRecordRepository (keyed by paymentIntentId) -
// the session never stores the live payment status itself, since Stripe's
// webhook (the only thing that reliably learns of an authorization) has no
// session cookie to update it with. BookingService.getState() refreshes
// `status` from the Redis PaymentRecord on every read instead.
export interface BookingPaymentPointer {
  paymentIntentId: string;
  status:
    | 'requires_payment'
    | 'requires_action'
    | 'authorized'
    | 'canceled'
    | 'failed';
}

export interface BookingSessionData {
  pricedOffer: PricedOffer;
  passengerCounts: PassengerCounts;
  passengers: Passenger[];
  step: BookingStep;
  payment?: BookingPaymentPointer;
}

declare module 'express-session' {
  interface SessionData {
    booking?: BookingSessionData;
  }
}
