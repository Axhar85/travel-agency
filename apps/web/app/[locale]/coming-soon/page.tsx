import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "ComingSoon" });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-20 text-center dark:bg-black">
      <span className="text-4xl" aria-hidden>
        🚧
      </span>
      <h1 className="text-2xl font-semibold text-black dark:text-white">{t("title")}</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">{t("body")}</p>
      <Link href="/" className="text-sm font-medium text-primary-700 underline dark:text-primary-300">
        {t("backHome")}
      </Link>
    </div>
  );
}
