"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, priceOffer, searchFlights, startBooking } from "@/lib/api";
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

const ISO_DURATION_PATTERN = /^PT(?:(\d+)H)?(?:(\d+)M)?$/;

function totalDurationMinutes(offer: FlightOffer): number {
  return offer.itineraries.reduce((sum, itinerary) => {
    const match = ISO_DURATION_PATTERN.exec(itinerary.duration);
    const hours = match?.[1] ? Number(match[1]) : 0;
    const minutes = match?.[2] ? Number(match[2]) : 0;
    return sum + hours * 60 + minutes;
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
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : t("genericError"));
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
    } catch (err) {
      setPricingError(err instanceof ApiError ? err.message : t("genericError"));
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
    } catch (err) {
      setBookingError(err instanceof ApiError ? err.message : t("genericError"));
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
            className="self-start text-sm font-medium text-black underline dark:text-white"
          >
            {t("backToResults")}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <Link href="/" className="self-start text-sm font-medium text-black underline dark:text-white">
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
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm text-black dark:border-zinc-700 dark:bg-black dark:text-white"
            >
              <option value="price">{t("sortPrice")}</option>
              <option value="duration">{t("sortDuration")}</option>
              <option value="stops">{t("sortStops")}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input type="checkbox" checked={nonStopOnly} onChange={(event) => setNonStopOnly(event.target.checked)} />
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
