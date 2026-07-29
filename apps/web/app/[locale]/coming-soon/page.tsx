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
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <span className="text-4xl" aria-hidden>
        🚧
      </span>
      <h1 className="text-2xl font-semibold text-black">{t("title")}</h1>
      <p className="max-w-md text-zinc-600">{t("body")}</p>
      <Link href="/" className="text-sm font-medium text-primary-700 underline">
        {t("backHome")}
      </Link>
    </div>
  );
}
