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

export type BookingStep = 'passengers' | 'review';

export interface BookingSessionData {
  pricedOffer: PricedOffer;
  passengerCounts: PassengerCounts;
  passengers: Passenger[];
  step: BookingStep;
}

declare module 'express-session' {
  interface SessionData {
    booking?: BookingSessionData;
  }
}
