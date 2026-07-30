import type {
  BookingRecord,
  BookingSessionData,
  DestinationCardData,
  HeroSlideData,
  Passenger,
  PaymentIntentResult,
  PricedOffer,
  PromoCardData,
  Promotion,
  SearchFlightsResponse,
  User,
} from "./types";

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

export async function createPaymentIntent(): Promise<PaymentIntentResult> {
  const response = await fetch(`${API_URL}/payments/intent`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PaymentIntentResult;
}

export async function getPromotions(): Promise<Promotion[]> {
  const response = await fetch(`${API_URL}/promotions`, { cache: "no-store" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as Promotion[];
}

export async function adminLogin(password: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

export async function getAllPromotions(): Promise<Promotion[]> {
  const response = await fetch(`${API_URL}/admin/promotions`, { credentials: "include", cache: "no-store" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as Promotion[];
}

export async function createPromotion(image: File, title: string, linkUrl: string): Promise<Promotion> {
  const formData = new FormData();
  formData.set("image", image);
  if (title) formData.set("title", title);
  if (linkUrl) formData.set("linkUrl", linkUrl);

  const response = await fetch(`${API_URL}/admin/promotions`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as Promotion;
}

export async function updatePromotion(id: string, patch: { isActive?: boolean }): Promise<Promotion> {
  const response = await fetch(`${API_URL}/admin/promotions/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as Promotion;
}

export async function deletePromotion(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/promotions/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

export async function reorderPromotions(orderedIds: string[]): Promise<void> {
  const response = await fetch(`${API_URL}/admin/promotions/reorder`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

// --- Customer accounts (optional login - guest checkout is unaffected) ---

export interface RegisterInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export async function register(input: RegisterInput): Promise<User> {
  const response = await fetch(`${API_URL}/account/register`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as User;
}

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${API_URL}/account/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as User;
}

export async function logout(): Promise<void> {
  const response = await fetch(`${API_URL}/account/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

export async function getMe(): Promise<User> {
  const response = await fetch(`${API_URL}/account/me`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as User;
}

export async function getMyBookings(): Promise<BookingRecord[]> {
  const response = await fetch(`${API_URL}/account/bookings`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as BookingRecord[];
}

// --- Hero slides (owner-editable homepage carousel) ---

export async function getHeroSlides(): Promise<HeroSlideData[]> {
  const response = await fetch(`${API_URL}/hero-slides`, { cache: "no-store" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as HeroSlideData[];
}

export async function getAllHeroSlides(): Promise<HeroSlideData[]> {
  const response = await fetch(`${API_URL}/admin/hero-slides`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as HeroSlideData[];
}

export interface HeroSlideInput {
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  linkUrl: string;
}

export async function createHeroSlide(
  image: File,
  input: HeroSlideInput,
): Promise<HeroSlideData> {
  const formData = new FormData();
  formData.set("image", image);
  formData.set("titleEs", input.titleEs);
  formData.set("titleEn", input.titleEn);
  formData.set("subtitleEs", input.subtitleEs);
  formData.set("subtitleEn", input.subtitleEn);
  formData.set("linkUrl", input.linkUrl);

  const response = await fetch(`${API_URL}/admin/hero-slides`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as HeroSlideData;
}

export async function updateHeroSlide(
  id: string,
  patch: { isActive?: boolean },
): Promise<HeroSlideData> {
  const response = await fetch(`${API_URL}/admin/hero-slides/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as HeroSlideData;
}

export async function deleteHeroSlide(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/hero-slides/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

export async function reorderHeroSlides(orderedIds: string[]): Promise<void> {
  const response = await fetch(`${API_URL}/admin/hero-slides/reorder`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

// --- Destination cards (owner-editable homepage category cards) ---

export async function getDestinationCards(): Promise<DestinationCardData[]> {
  const response = await fetch(`${API_URL}/destination-cards`, { cache: "no-store" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as DestinationCardData[];
}

export async function getAllDestinationCards(): Promise<DestinationCardData[]> {
  const response = await fetch(`${API_URL}/admin/destination-cards`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as DestinationCardData[];
}

export type DestinationCardInput = HeroSlideInput;

export async function createDestinationCard(
  image: File,
  input: DestinationCardInput,
): Promise<DestinationCardData> {
  const formData = new FormData();
  formData.set("image", image);
  formData.set("titleEs", input.titleEs);
  formData.set("titleEn", input.titleEn);
  formData.set("subtitleEs", input.subtitleEs);
  formData.set("subtitleEn", input.subtitleEn);
  formData.set("linkUrl", input.linkUrl);

  const response = await fetch(`${API_URL}/admin/destination-cards`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as DestinationCardData;
}

export async function updateDestinationCard(
  id: string,
  patch: { isActive?: boolean },
): Promise<DestinationCardData> {
  const response = await fetch(`${API_URL}/admin/destination-cards/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as DestinationCardData;
}

export async function deleteDestinationCard(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/destination-cards/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

export async function reorderDestinationCards(orderedIds: string[]): Promise<void> {
  const response = await fetch(`${API_URL}/admin/destination-cards/reorder`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

// --- Promo cards (owner-editable homepage promotions grid, separate feed from destination cards) ---

export async function getPromoCards(): Promise<PromoCardData[]> {
  const response = await fetch(`${API_URL}/promo-cards`, { cache: "no-store" });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PromoCardData[];
}

export async function getAllPromoCards(): Promise<PromoCardData[]> {
  const response = await fetch(`${API_URL}/admin/promo-cards`, {
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PromoCardData[];
}

export type PromoCardInput = HeroSlideInput;

export async function createPromoCard(
  image: File,
  input: PromoCardInput,
): Promise<PromoCardData> {
  const formData = new FormData();
  formData.set("image", image);
  formData.set("titleEs", input.titleEs);
  formData.set("titleEn", input.titleEn);
  formData.set("subtitleEs", input.subtitleEs);
  formData.set("subtitleEn", input.subtitleEn);
  formData.set("linkUrl", input.linkUrl);

  const response = await fetch(`${API_URL}/admin/promo-cards`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PromoCardData;
}

export async function updatePromoCard(
  id: string,
  patch: { isActive?: boolean },
): Promise<PromoCardData> {
  const response = await fetch(`${API_URL}/admin/promo-cards/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }

  return (await response.json()) as PromoCardData;
}

export async function deletePromoCard(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/admin/promo-cards/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}

export async function reorderPromoCards(orderedIds: string[]): Promise<void> {
  const response = await fetch(`${API_URL}/admin/promo-cards/reorder`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderedIds }),
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorMessage(response), response.status);
  }
}
