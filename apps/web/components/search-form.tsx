"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { inputClass, labelClass } from "@/lib/ui";
import { AirportAutocomplete } from "./airport-autocomplete";
import { PassengerSelector, type PassengerCounts } from "./passenger-selector";
import { Button } from "./ui/button";

type TripType = "roundtrip" | "oneway";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  // Native date inputs report value="" while a segment is mid-edit (e.g. the
  // user clears the day). Falling back to today avoids crashing the `min`
  // attribute computation on an Invalid Date's toISOString().
  if (Number.isNaN(date.getTime())) {
    return today();
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

interface SearchFormProps {
  /** Pre-fills the destination field - used by the Hajj & Umrah search tab to default toward Jeddah/Madinah. */
  defaultDestination?: string;
}

export function SearchForm({ defaultDestination }: SearchFormProps = {}) {
  const t = useTranslations("SearchForm");
  const router = useRouter();

  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState(defaultDestination ?? "");
  const [departureDate, setDepartureDate] = useState(today());
  const [returnDate, setReturnDate] = useState(addDays(today(), 7));
  const [passengers, setPassengers] = useState<PassengerCounts>({
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "ECONOMY",
  });
  const [error, setError] = useState<string | null>(null);

  function swapAirports() {
    setOrigin(destination);
    setDestination(origin);
  }

  function handleDepartureDateChange(value: string) {
    setDepartureDate(value);
    if (tripType === "roundtrip" && returnDate <= value) {
      setReturnDate(addDays(value, 1));
    }
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!origin || !destination) {
      setError(t("errorSelectAirports"));
      return;
    }
    if (origin === destination) {
      setError(t("errorSameAirport"));
      return;
    }

    const params = new URLSearchParams({
      origin,
      destination,
      departureDate,
      adults: String(passengers.adults),
      cabinClass: passengers.cabinClass,
    });
    if (tripType === "roundtrip") params.set("returnDate", returnDate);
    if (passengers.children) params.set("children", String(passengers.children));
    if (passengers.infants) params.set("infants", String(passengers.infants));

    router.push(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4 text-left">
      <div className="flex gap-4 text-sm text-black">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tripType"
            checked={tripType === "roundtrip"}
            onChange={() => setTripType("roundtrip")}
            className="accent-primary-600"
          />
          {t("tripType.roundTrip")}
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tripType"
            checked={tripType === "oneway"}
            onChange={() => setTripType("oneway")}
            className="accent-primary-600"
          />
          {t("tripType.oneWay")}
        </label>
      </div>

      {/* Stacked on mobile/tablet; a single wide row on large screens, matching
          a conventional flight-search bar rather than a narrow stacked card. */}
      <div className="flex flex-col gap-4 lg:flex-row lg:flex-nowrap lg:items-end lg:gap-2">
        <div className="lg:min-w-0 lg:basis-0 lg:flex-[1.4]">
          <AirportAutocomplete
            label={t("origin")}
            placeholder={t("originPlaceholder")}
            value={origin}
            onChange={setOrigin}
            excludeCode={destination}
          />
        </div>

        <div className="flex justify-center lg:mb-2.5 lg:shrink-0">
          <button
            type="button"
            onClick={swapAirports}
            aria-label={t("swapAirports")}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-300 bg-white text-sm text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50"
          >
            ⇄
          </button>
        </div>

        <div className="lg:min-w-0 lg:basis-0 lg:flex-[1.4]">
          <AirportAutocomplete
            label={t("destination")}
            placeholder={t("destinationPlaceholder")}
            value={destination}
            onChange={setDestination}
            excludeCode={origin}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:contents">
          <div className="flex flex-col gap-1 lg:min-w-0 lg:basis-0 lg:flex-1">
            <label htmlFor="departureDate" className={labelClass}>
              {t("departureDate")}
            </label>
            <input
              id="departureDate"
              type="date"
              min={today()}
              value={departureDate}
              onChange={(event) => handleDepartureDateChange(event.target.value)}
              required
              className={inputClass}
            />
          </div>
          {tripType === "roundtrip" && (
            <div className="flex flex-col gap-1 lg:min-w-0 lg:basis-0 lg:flex-1">
              <label htmlFor="returnDate" className={labelClass}>
                {t("returnDate")}
              </label>
              <input
                id="returnDate"
                type="date"
                min={addDays(departureDate, 1)}
                value={returnDate}
                onChange={(event) => setReturnDate(event.target.value)}
                required
                className={inputClass}
              />
            </div>
          )}
        </div>

        <div className="lg:min-w-0 lg:basis-0 lg:flex-1">
          <PassengerSelector value={passengers} onChange={setPassengers} />
        </div>

        <Button type="submit" className="w-full lg:w-auto lg:shrink-0">
          {t("search")}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
