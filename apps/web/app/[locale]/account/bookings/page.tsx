import { setRequestLocale } from "next-intl/server";
import { MyBookingsList } from "@/components/my-bookings-list";

export default async function AccountBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <MyBookingsList />
    </div>
  );
}
