"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { priceOffer, searchFlights, startBooking } from "@/lib/api";
import { parseIsoDuration } from "@/lib/format";
import { inputClass } from "@/lib/ui";
import type { FlightOffer, PricedOffer } from "@/lib/types";
import { OfferCard } from "./offer-card";
import { OfferSkeleton } from "./offer-skeleton";
import { PriceConfirmation } from "./price-confirmation";

type SortKey = "price" | "duration" | "stops";

interface SearchResultsProps {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults: number;
  childCount?: number;
  infants?: number;
  cabinClass?: string;
}

function totalDurationMinutes(offer: FlightOffer): number {
  return offer.itineraries.reduce((sum, itinerary) => {
    const parsed = parseIsoDuration(itinerary.duration);
    return sum + (parsed ? parsed.hours * 60 + parsed.minutes : 0);
  }, 0);
}

function totalStops(offer: FlightOffer): number {
  return offer.itineraries.reduce((sum, itinerary) => sum + (itinerary.segments.length - 1), 0);
}

export function SearchResults(props: SearchResultsProps) {
  const t = useTranslations("SearchResults");
  const router = useRouter();
  const { origin, destination, departureDate, returnDate, adults, childCount, infants, cabinClass } = props;

  const [offers, setOffers] = useState<FlightOffer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [nonStopOnly, setNonStopOnly] = useState(false);

  const [selectedOffer, setSelectedOffer] = useState<FlightOffer | null>(null);
  const [pricedOffer, setPricedOffer] = useState<PricedOffer | null>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [startingBooking, setStartingBooking] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  useEffect(() => {
    // Standard "fetch on dependency change" effect (see
    // https://react.dev/learn/you-might-not-need-an-effect#fetching-data):
    // resetting to a loading state before the async call is intentional so
    // stale results don't linger on screen while the new search runs.
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOffers(null);
    setError(null);

    searchFlights({ origin, destination, departureDate, returnDate, adults, children: childCount, infants, cabinClass })
      .then((result) => {
        if (!cancelled) setOffers(result.offers);
      })
      .catch(() => {
        // Backend error messages are English-only prose, not localized -
        // always show our own translated copy instead of leaking raw
        // backend text into a Spanish (or any non-English) page.
        if (!cancelled) setError(t("genericError"));
      });

    return () => {
      cancelled = true;
    };
  }, [origin, destination, departureDate, returnDate, adults, childCount, infants, cabinClass, t]);

  const visibleOffers = useMemo(() => {
    if (!offers) return [];
    const filtered = nonStopOnly ? offers.filter((offer) => totalStops(offer) === 0) : offers;
    return [...filtered].sort((a, b) => {
      if (sortKey === "price") return Number(a.price.total) - Number(b.price.total);
      if (sortKey === "duration") return totalDurationMinutes(a) - totalDurationMinutes(b);
      return totalStops(a) - totalStops(b);
    });
  }, [offers, sortKey, nonStopOnly]);

  async function handleSelect(offer: FlightOffer) {
    setSelectedOffer(offer);
    setPricedOffer(null);
    setPricingError(null);
    try {
      setPricedOffer(await priceOffer(offer.id));
    } catch {
      setPricingError(t("genericError"));
    }
  }

  function handleBackToResults() {
    setSelectedOffer(null);
    setPricedOffer(null);
    setPricingError(null);
    setBookingError(null);
  }

  async function handleContinue() {
    if (!pricedOffer) return;
    setStartingBooking(true);
    setBookingError(null);
    try {
      await startBooking({ offerId: pricedOffer.id, adults, children: childCount, infants });
      router.push(`/booking/passengers`);
    } catch {
      setBookingError(t("genericError"));
    } finally {
      setStartingBooking(false);
    }
  }

  if (selectedOffer) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-4">
        {pricingError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
            {pricingError}
          </div>
        )}
        {!pricedOffer && !pricingError && <OfferSkeleton />}
        {pricedOffer && (
          <PriceConfirmation
            pricedOffer={pricedOffer}
            onBack={handleBackToResults}
            onContinue={handleContinue}
            isContinuing={startingBooking}
          />
        )}
        {bookingError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
            {bookingError}
          </div>
        )}
        {(pricingError || bookingError) && (
          <button
            type="button"
            onClick={handleBackToResults}
            className="self-start text-sm font-medium text-primary-700 underline dark:text-primary-300"
          >
            {t("backToResults")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Link href="/" className="self-start text-sm font-medium text-primary-700 underline dark:text-primary-300">
        {t("newSearch")}
      </Link>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      {!error && offers && offers.length === 0 && <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("noResults")}</p>}

      {!error && offers && offers.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <span className="text-zinc-600 dark:text-zinc-400">{t("sortBy")}</span>
            <select
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className={`px-2 py-1 ${inputClass}`}
            >
              <option value="price">{t("sortPrice")}</option>
              <option value="duration">{t("sortDuration")}</option>
              <option value="stops">{t("sortStops")}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={nonStopOnly}
              onChange={(event) => setNonStopOnly(event.target.checked)}
              className="accent-primary-600"
            />
            {t("nonStopOnly")}
          </label>
        </div>
      )}

      {!offers && !error && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <OfferSkeleton key={index} />
          ))}
        </div>
      )}

      {!error && visibleOffers.length > 0 && (
        <div className="flex flex-col gap-3">
          {visibleOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} onSelect={handleSelect} />
          ))}
        </div>
      )}
    </div>
  );
}
