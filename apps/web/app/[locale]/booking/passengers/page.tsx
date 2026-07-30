import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PassengerDetailsForm } from "@/components/passenger-details-form";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function PassengersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <PassengerDetailsForm />
    </div>
  );
}
