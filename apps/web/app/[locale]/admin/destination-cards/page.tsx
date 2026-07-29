import { setRequestLocale } from "next-intl/server";
import { AdminDestinationCardsDashboard } from "@/components/admin-destination-cards-dashboard";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminDestinationCardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      <AdminNav />
      <AdminDestinationCardsDashboard />
    </div>
  );
}
