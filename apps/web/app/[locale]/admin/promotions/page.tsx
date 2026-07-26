import { setRequestLocale } from "next-intl/server";
import { AdminPromotionsDashboard } from "@/components/admin-promotions-dashboard";

export default async function AdminPromotionsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <AdminPromotionsDashboard />
    </div>
  );
}
