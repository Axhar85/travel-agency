"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import type { FlightItinerary, FlightOffer } from "@/lib/types";
import { Button } from "./ui/button";

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
        <span className="font-semibold text-black">{formatTime(firstSegment.departure.at, locale)}</span>
        <span className="text-zinc-500">{firstSegment.departure.iataCode}</span>
        <span className="text-zinc-400">→</span>
        <span className="font-semibold text-black">{formatTime(lastSegment.arrival.at, locale)}</span>
        <span className="text-zinc-500">{lastSegment.arrival.iataCode}</span>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
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
    <div className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="divide-y divide-zinc-100">
        {offer.itineraries.map((itinerary, index) => (
          <ItineraryRow key={index} itinerary={itinerary} />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-zinc-100 pt-3">
        <span className="text-lg font-semibold text-accent-700">
          {formatPrice(offer.price.total, offer.price.currency, locale)}
        </span>
        <Button type="button" onClick={() => onSelect(offer)} className="px-5 py-2">
          {t("select")}
        </Button>
      </div>
    </div>
  );
}
