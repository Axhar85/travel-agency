import type { BookingSessionData, Passenger, PricedOffer, SearchFlightsResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === "object" && "message" in body) {
      const { message } = body as { message: unknown };
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
  } catch {
    // response wasn't JSON - fall through to the generic message below
  }
  return `Request failed with status ${response.status}`;
}

export interface SearchFlightsQuery {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  children?: number;
  infants?: number;
  cabinClass?: string;
}

export async function searchFlights(query: SearchFlightsQuery): Promise<SearchFlightsResponse> {
  const params = new URLSearchParams({
    origin: query.origin,
    destination: query.destination,
    departureDate: query.departureDate,
    adults: String(query.adults),
  });
  if (query.returnDate) params.set("returnDate", query.returnDate);
  if (query.children) params.set("children", String(query.children));
  if (query.infants) params.set("infants", String(query.infants));
  if (query.cabinClass) params.set("cabinClass", query.cabinClass);

  const response = await fetch(`${API_URL}/search/flights?${params.toString()}`, { cache: "no-store" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as SearchFlightsResponse;
}

export async function priceOffer(offerId: string): Promise<PricedOffer> {
  const response = await fetch(`${API_URL}/search/offers/${offerId}/price`, { method: "POST" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PricedOffer;
}

export interface StartBookingQuery {
  offerId: string;
  adults: number;
  children?: number;
  infants?: number;
}

// The booking session lives server-side behind an httpOnly cookie -
// `credentials: "include"` is required on every booking call so the browser
// sends/accepts that cookie across the frontend/backend origins.

export async function startBooking(query: StartBookingQuery): Promise<BookingSessionData> {
  const response = await fetch(`${API_URL}/booking/start`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as BookingSessionData;
}

export async function getBookingState(): Promise<BookingSessionData> {
  const response = await fetch(`${API_URL}/booking/state`, { credentials: "include", cache: "no-store" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as BookingSessionData;
}

export async function submitPassengers(passengers: Passenger[]): Promise<BookingSessionData> {
  const response = await fetch(`${API_URL}/booking/passengers`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ passengers }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as BookingSessionData;
}
