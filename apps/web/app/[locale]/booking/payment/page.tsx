import type { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingPayment } from "@/components/booking-payment";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Payment" });

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      {/* BookingPayment calls useSearchParams() (reads the Stripe 3DS
          return_url's payment_intent_client_secret) - Next.js requires that
          be wrapped in Suspense so this page can still prerender everything
          above it, rather than opting the whole page out of static
          generation (fails the production build otherwise). Same fallback
          text BookingPayment itself shows for its own "loading" phase, so
          there's no visible flash of different text on hydration. */}
      <Suspense fallback={<p className="text-sm text-zinc-600">{t("loading")}</p>}>
        <BookingPayment />
      </Suspense>
    </div>
  );
}
