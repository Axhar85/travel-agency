"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { AirportAutocomplete } from "./airport-autocomplete";
import { PassengerSelector, type PassengerCounts } from "./passenger-selector";

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

export function SearchForm() {
  const t = useTranslations("SearchForm");
  const router = useRouter();

  const [tripType, setTripType] = useState<TripType>("roundtrip");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
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
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-6"
    >
      <div className="flex gap-4 text-sm text-black dark:text-white">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tripType"
            checked={tripType === "roundtrip"}
            onChange={() => setTripType("roundtrip")}
          />
          {t("tripType.roundTrip")}
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="tripType" checked={tripType === "oneway"} onChange={() => setTripType("oneway")} />
          {t("tripType.oneWay")}
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AirportAutocomplete
          label={t("origin")}
          placeholder={t("originPlaceholder")}
          value={origin}
          onChange={setOrigin}
          excludeCode={destination}
        />
        <div className="relative">
          <AirportAutocomplete
            label={t("destination")}
            placeholder={t("destinationPlaceholder")}
            value={destination}
            onChange={setDestination}
            excludeCode={origin}
          />
          <button
            type="button"
            onClick={swapAirports}
            aria-label={t("swapAirports")}
            className="absolute -top-1 right-0 hidden rounded-full border border-zinc-300 bg-white p-1 text-xs text-black dark:border-zinc-700 dark:bg-black dark:text-white sm:block"
          >
            ⇄
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="departureDate" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {t("departureDate")}
          </label>
          <input
            id="departureDate"
            type="date"
            min={today()}
            value={departureDate}
            onChange={(event) => handleDepartureDateChange(event.target.value)}
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          />
        </div>
        {tripType === "roundtrip" && (
          <div className="flex flex-col gap-1">
            <label htmlFor="returnDate" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("returnDate")}
            </label>
            <input
              id="returnDate"
              type="date"
              min={addDays(departureDate, 1)}
              value={returnDate}
              onChange={(event) => setReturnDate(event.target.value)}
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </div>
        )}
        <PassengerSelector value={passengers} onChange={setPassengers} />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background sm:w-auto sm:self-start"
      >
        {t("search")}
      </button>
    </form>
  );
}
