import { setRequestLocale } from "next-intl/server";
import { BookingPayment } from "@/components/booking-payment";

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <BookingPayment />
    </div>
  );
}
