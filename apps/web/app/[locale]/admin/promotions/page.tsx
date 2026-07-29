import { setRequestLocale } from "next-intl/server";
import { AdminNav } from "@/components/admin-nav";
import { AdminPromotionsDashboard } from "@/components/admin-promotions-dashboard";

export default async function AdminPromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      <AdminNav />
      <AdminPromotionsDashboard />
    </div>
  );
}
