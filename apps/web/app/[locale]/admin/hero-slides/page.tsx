import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AdminHeroSlidesDashboard } from "@/components/admin-hero-slides-dashboard";
import { AdminNav } from "@/components/admin-nav";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminHeroSlidesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-6 py-12">
      <AdminNav />
      <AdminHeroSlidesDashboard />
    </div>
  );
}
