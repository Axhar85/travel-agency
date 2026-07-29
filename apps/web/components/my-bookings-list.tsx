"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ApiError, getMyBookings } from "@/lib/api";
import { formatDate, formatPrice } from "@/lib/format";
import { cardClass } from "@/lib/ui";
import type { BookingRecord } from "@/lib/types";

export function MyBookingsList() {
  const t = useTranslations("Account");
  const locale = useLocale();
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingRecord[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const list = await getMyBookings();
        setBookings(list);
      } catch (error) {
        if (error instanceof ApiError && error.statusCode === 401) {
          router.push("/account/login");
          return;
        }
        setLoadError(true);
      }
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loadError) {
    return <p className="text-sm text-red-600">{t("bookingsLoadError")}</p>;
  }

  if (!bookings) {
    return <p className="text-sm text-zinc-600">{t("loading")}</p>;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <h1 className="text-xl font-semibold text-black">{t("bookingsTitle")}</h1>
      {bookings.length === 0 && <p className="text-sm text-zinc-600">{t("noBookings")}</p>}
      {bookings.map((booking) => {
        const firstItinerary = booking.offerSnapshot.itineraries[0];
        const firstSegment = firstItinerary?.segments[0];
        const lastSegment = firstItinerary?.segments[firstItinerary.segments.length - 1];
        return (
          <div key={booking.id} className={`flex flex-col gap-2 p-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-black">
                {firstSegment && lastSegment
                  ? `${firstSegment.departure.iataCode} → ${lastSegment.arrival.iataCode}`
                  : booking.offerSnapshot.id}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  booking.status === "PAYMENT_AUTHORIZED"
                    ? "bg-primary-50 text-primary-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {booking.status === "PAYMENT_AUTHORIZED" ? t("statusAuthorized") : t("statusFailed")}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-zinc-600">
              <span>
                {firstSegment ? formatDate(firstSegment.departure.at, locale) : ""} ·{" "}
                {t("passengerCount", { count: booking.passengers.length })}
              </span>
              <span className="font-semibold text-accent-700">
                {formatPrice(booking.offerSnapshot.price.total, booking.currency, locale)}
              </span>
            </div>
            <span className="text-xs text-zinc-500">
              {t("bookedOn", { date: formatDate(booking.createdAt, locale) })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
