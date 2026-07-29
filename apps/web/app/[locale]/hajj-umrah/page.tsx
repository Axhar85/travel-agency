import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { SearchForm } from "@/components/search-form";
import { searchCardClass } from "@/lib/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HajjUmrah" });

  return {
    // absolute - the copy already includes the brand name, so it shouldn't
    // also get the layout's "%s | Naafi Travels" template suffix appended.
    title: { absolute: t("title") },
    description: t("subtitle"),
  };
}

export default async function HajjUmrahPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HajjUmrah" });

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="relative flex w-full items-center justify-center overflow-hidden py-20">
        <Image
          src="https://images.unsplash.com/photo-1513072064285-240f87fa81e8?auto=format&fit=crop&w=1600&q=75"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative flex flex-col items-center gap-3 px-6 text-center">
          <h1 className="max-w-xl text-3xl font-semibold text-white">{t("title")}</h1>
          <p className="max-w-lg text-primary-100">{t("subtitle")}</p>
        </div>
      </div>

      <div className="flex w-full max-w-5xl flex-col items-center gap-8 px-6 py-12">
        <p className="max-w-xl text-center text-zinc-600">{t("body")}</p>
        <div className={`w-full p-4 sm:p-6 ${searchCardClass}`}>
          <SearchForm defaultDestination="JED" />
        </div>
        <p className="text-xs text-zinc-500">{t("destinationHint")}</p>
      </div>
    </div>
  );
}
