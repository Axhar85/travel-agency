import { loadStripe, Stripe } from "@stripe/stripe-js";

// loadStripe() should only ever be called once per page load (per Stripe's
// own guidance) - module-level memoization keeps a single promise around
// even if PaymentForm mounts more than once.
let stripePromise: Promise<Stripe | null> | undefined;

export function getStripe(): Promise<Stripe | null> {
  stripePromise ??= loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");
  return stripePromise;
}
