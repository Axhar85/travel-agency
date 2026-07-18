"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import type { FlightItinerary, FlightOffer } from "@/lib/types";

function ItineraryRow({ itinerary }: { itinerary: FlightItinerary }) {
  const t = useTranslations("SearchResults");
  const locale = useLocale();
  const firstSegment = itinerary.segments[0];
  const lastSegment = itinerary.segments[itinerary.segments.length - 1];
  const stops = itinerary.segments.length - 1;
  const carriers = Array.from(new Set(itinerary.segments.map((s) => s.carrierCode)));

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
      <div className="flex items-baseline gap-2">
        <span className="font-semibold text-black dark:text-white">{formatTime(firstSegment.departure.at, locale)}</span>
        <span className="text-zinc-500 dark:text-zinc-400">{firstSegment.departure.iataCode}</span>
        <span className="text-zinc-400">→</span>
        <span className="font-semibold text-black dark:text-white">{formatTime(lastSegment.arrival.at, locale)}</span>
        <span className="text-zinc-500 dark:text-zinc-400">{lastSegment.arrival.iataCode}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{formatDate(firstSegment.departure.at, locale)}</span>
        <span>·</span>
        <span>{formatDuration(itinerary.duration)}</span>
        <span>·</span>
        <span>{stops === 0 ? t("nonStop") : t("stops", { count: stops })}</span>
        <span>·</span>
        <span>{carriers.join("/")}</span>
      </div>
    </div>
  );
}

interface OfferCardProps {
  offer: FlightOffer;
  onSelect: (offer: FlightOffer) => void;
}

export function OfferCard({ offer, onSelect }: OfferCardProps) {
  const t = useTranslations("SearchResults");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {offer.itineraries.map((itinerary, index) => (
          <ItineraryRow key={index} itinerary={itinerary} />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="text-lg font-semibold text-black dark:text-white">
          {formatPrice(offer.price.total, offer.price.currency, locale)}
        </span>
        <button
          type="button"
          onClick={() => onSelect(offer)}
          className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background"
        >
          {t("select")}
        </button>
      </div>
    </div>
  );
}
