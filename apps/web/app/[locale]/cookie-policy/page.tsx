import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CookiePolicy" });
  return { title: t("title") };
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "CookiePolicy" });

  return (
    <div className="flex w-full flex-1 flex-col items-center px-6 py-12">
      <div className="flex w-full max-w-2xl flex-col gap-8">
        <h1 className="text-2xl font-semibold text-black">{t("title")}</h1>
        <p className="text-sm text-zinc-600">{t("intro")}</p>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-black">{t("necessaryHeading")}</h2>
          <p className="text-sm text-zinc-600">{t("necessaryBody")}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-black">{t("paymentHeading")}</h2>
          <p className="text-sm text-zinc-600">{t("paymentBody")}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-black">{t("preferenceHeading")}</h2>
          <p className="text-sm text-zinc-600">{t("preferenceBody")}</p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-black">{t("noAnalyticsHeading")}</h2>
          <p className="text-sm text-zinc-600">{t("noAnalyticsBody")}</p>
        </section>
      </div>
    </div>
  );
}
