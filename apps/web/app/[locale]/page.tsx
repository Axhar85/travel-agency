import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
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
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <LocaleSwitcher />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-md text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
          <p className="max-w-md text-base text-zinc-500 dark:text-zinc-500">
            {t("comingSoon")}
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <span className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background md:w-auto md:px-8">
            {t("ctaSearch")}
          </span>
          <span className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 dark:border-white/[.145] md:w-auto md:px-8">
            {t("ctaLearnMore")}
          </span>
        </div>
      </main>
    </div>
  );
}
