import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { PopularRoutes } from "@/components/popular-routes";
import { PromotionsBanner } from "@/components/promotions-banner";
import { SearchForm } from "@/components/search-form";
import { LocaleSwitcher } from "./locale-switcher";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations("HomePage");

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <div className="w-full bg-gradient-to-b from-primary-800 via-primary-700 to-primary-600">
        <div className="mx-auto flex w-full max-w-3xl justify-end px-6 pt-6">
          <LocaleSwitcher inverted />
        </div>
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-6 pb-16 pt-10 sm:pb-24 sm:pt-16">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-300">
              {t("tagline")}
            </span>
            <h1 className="max-w-lg text-3xl font-semibold leading-10 tracking-tight text-white">
              {t("title")}
            </h1>
            <p className="max-w-md text-lg leading-8 text-primary-100">
              {t("subtitle")}
            </p>
          </div>
          <SearchForm />
        </main>
      </div>

      <div className="flex w-full max-w-3xl flex-col items-center gap-8 pt-8">
        <PromotionsBanner />
      </div>

      <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-12">
        <PopularRoutes />
      </div>
    </div>
  );
}
