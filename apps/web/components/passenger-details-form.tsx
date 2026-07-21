"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ApiError, getBookingState, submitPassengers } from "@/lib/api";
import type { BookingSessionData, Passenger, PassengerType } from "@/lib/types";
import { PassengerForm } from "./passenger-form";

function emptyPassenger(type: PassengerType): Passenger {
  return {
    type,
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "MALE",
    email: type === "ADULT" ? "" : undefined,
    phone: type === "ADULT" ? "" : undefined,
    document: {
      documentType: "PASSPORT",
      number: "",
      expiryDate: "",
      issuanceCountry: "",
      nationality: "",
      holder: true,
    },
  };
}

function buildInitialPassengers(counts: BookingSessionData["passengerCounts"]): Passenger[] {
  return [
    ...Array.from({ length: counts.adults }, () => emptyPassenger("ADULT")),
    ...Array.from({ length: counts.children }, () => emptyPassenger("CHILD")),
    ...Array.from({ length: counts.infants }, () => emptyPassenger("INFANT")),
  ];
}

export function PassengerDetailsForm() {
  const t = useTranslations("PassengerForm");

  const [booking, setBooking] = useState<BookingSessionData | null>(null);
  // Any load failure here is shown as "your booking expired, search again"
  // (see the sessionExpired copy below) - the only realistic cause is a
  // missing/expired session, so the specific error text isn't surfaced.
  const [hasLoadError, setHasLoadError] = useState(false);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getBookingState()
      .then((state) => {
        if (cancelled) return;
        setBooking(state);
        setPassengers(state.passengers.length > 0 ? state.passengers : buildInitialPassengers(state.passengerCounts));
      })
      .catch(() => {
        if (!cancelled) setHasLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updatePassenger(index: number, updated: Passenger) {
    setPassengers((current) => current.map((p, i) => (i === index ? updated : p)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitPassengers(passengers);
      setSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : t("genericError"));
    } finally {
      setSubmitting(false);
    }
  }

  if (hasLoadError) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {t("sessionExpired")}
        </div>
        <Link href="/" className="self-start text-sm font-medium text-black underline dark:text-white">
          {t("backToSearch")}
        </Link>
      </div>
    );
  }

  if (!booking) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("loading")}</p>;
  }

  if (success) {
    return (
      <div className="flex w-full max-w-2xl flex-col gap-4">
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
          {t("success")}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-black dark:text-white">{t("title")}</h1>

      {passengers.map((passenger, index) => (
        <PassengerForm
          key={index}
          index={index}
          type={passenger.type}
          value={passenger}
          onChange={(updated) => updatePassenger(index, updated)}
        />
      ))}

      {submitError && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {submitError}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background disabled:opacity-50 sm:w-auto sm:self-start"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
