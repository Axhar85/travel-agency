"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { getStripe } from "@/lib/stripe";
import { Button } from "./ui/button";

interface PaymentFormProps {
  clientSecret: string;
  onAuthorized: () => void;
}

function CheckoutForm({ onAuthorized }: { onAuthorized: () => void }) {
  const t = useTranslations("Payment");
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    // redirect: 'if_required' keeps the customer in-page whenever Stripe can
    // complete 3DS/SCA without a full navigation - return_url only matters
    // for the payment methods that truly require leaving the page, in which
    // case the browser comes back here with payment_intent_client_secret in
    // the query string (handled by the page component, not this form).
    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}${window.location.pathname}`,
      },
    });

    if (confirmError) {
      // Stripe writes confirmError.message for direct customer display.
      setError(confirmError.message ?? t("genericError"));
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "requires_capture" || paymentIntent?.status === "succeeded") {
      onAuthorized();
      return;
    }

    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
      <PaymentElement />
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}
      <Button type="submit" disabled={!stripe || submitting} className="w-full sm:w-auto sm:self-start">
        {submitting ? t("processing") : t("pay")}
      </Button>
    </form>
  );
}

export function PaymentForm({ clientSecret, onAuthorized }: PaymentFormProps) {
  return (
    <Elements stripe={getStripe()} options={{ clientSecret }}>
      <CheckoutForm onAuthorized={onAuthorized} />
    </Elements>
  );
}
