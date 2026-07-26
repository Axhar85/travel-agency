"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { createPaymentIntent } from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { PaymentForm } from "./payment-form";

type Phase = "loading" | "form" | "authorized" | "failed" | "error";

export function BookingPayment() {
  const t = useTranslations("Payment");
  const searchParams = useSearchParams();

  const [phase, setPhase] = useState<Phase>("loading");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountMinorUnits, setAmountMinorUnits] = useState(0);
  const [currency, setCurrency] = useState("EUR");

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setPhase("loading");

      // Returning from a 3DS redirect - Stripe appends this to return_url
      // for payment methods that couldn't complete authentication in-page.
      // Check the intent directly via the client SDK rather than starting a
      // new one.
      const returnedSecret = searchParams.get("payment_intent_client_secret");
      if (returnedSecret) {
        const stripe = await getStripe();
        const result = await stripe?.retrievePaymentIntent(returnedSecret);
        if (cancelled) return;
        const status = result?.paymentIntent?.status;
        setPhase(status === "requires_capture" || status === "succeeded" ? "authorized" : "failed");
        return;
      }

      try {
        const intent = await createPaymentIntent();
        if (cancelled) return;
        setAmountMinorUnits(intent.amountMinorUnits);
        setCurrency(intent.currency);
        if (intent.status === "authorized") {
          setPhase("authorized");
        } else if (intent.clientSecret) {
          setClientSecret(intent.clientSecret);
          setPhase("form");
        } else {
          setPhase("error");
        }
      } catch {
        if (!cancelled) setPhase("error");
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const amount = (amountMinorUnits / 100).toFixed(2);

  if (phase === "loading") {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("loading")}</p>;
  }

  if (phase === "error") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {t("sessionExpired")}
        </div>
        <Link href="/" className="self-start text-sm font-medium text-primary-700 underline dark:text-primary-300">
          {t("backToSearch")}
        </Link>
      </div>
    );
  }

  if (phase === "authorized") {
    return (
      <div className="w-full max-w-md rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900 dark:border-green-700 dark:bg-green-950 dark:text-green-200">
        {t("authorizedMessage")}
      </div>
    );
  }

  if (phase === "failed") {
    return (
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {t("genericError")}
        </div>
        <button
          type="button"
          onClick={() => {
            // 'failed' is only reached after a redirect-based payment method
            // came back unsuccessful, which leaves payment_intent_client_secret
            // in the URL - a full reload of the bare path is the simplest way
            // to guarantee a clean retry (fresh state, no stale query param)
            // rather than re-checking the same failed intent.
            window.location.href = window.location.pathname;
          }}
          className="self-start text-sm font-medium text-primary-700 underline dark:text-primary-300"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <h1 className="text-xl font-semibold text-black dark:text-white">{t("title")}</h1>
      <p className="text-lg font-semibold text-accent-700 dark:text-accent-400">
        {t("amountLabel", { amount, currency })}
      </p>
      {clientSecret && (
        <PaymentForm clientSecret={clientSecret} onAuthorized={() => setPhase("authorized")} />
      )}
    </div>
  );
}
