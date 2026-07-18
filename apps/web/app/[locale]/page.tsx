import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
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
      <div className="flex w-full max-w-3xl justify-end px-6 pt-6">
        <LocaleSwitcher />
      </div>
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-6 py-12 sm:py-20">
        <div className="flex flex-col items-center gap-3 text-center">
          <h1 className="max-w-lg text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            {t("title")}
          </h1>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            {t("subtitle")}
          </p>
        </div>
        <SearchForm />
      </main>
    </div>
  );
}
