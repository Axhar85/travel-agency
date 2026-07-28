import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { SearchForm } from "@/components/search-form";
import { cardClass } from "@/lib/ui";

export default async function HajjUmrahPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "HajjUmrah" });

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 dark:bg-black">
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

      <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-12">
        <p className="max-w-xl text-center text-zinc-600 dark:text-zinc-400">{t("body")}</p>
        <div className={`w-full p-4 sm:p-6 ${cardClass}`}>
          <SearchForm defaultDestination="JED" />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{t("destinationHint")}</p>
      </div>
    </div>
  );
}
