import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { CategoryCards } from "@/components/category-cards";
import { PromotionsBanner } from "@/components/promotions-banner";
import { SearchWidget } from "@/components/search-widget";

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

const SERVICES = [
  { key: "cheapFlights", icon: "✈", href: "/#search" },
  { key: "hotels", icon: "🏨", href: "/coming-soon" },
  { key: "hajjUmrah", icon: "🕋", href: "/hajj-umrah" },
  { key: "holidays", icon: "🏖", href: "/coming-soon" },
  { key: "travelInsurance", icon: "🛡", href: "/coming-soon" },
  { key: "extraBaggage", icon: "🧳", href: "/coming-soon" },
  { key: "visaServices", icon: "🛂", href: "/coming-soon" },
  { key: "airportTransfers", icon: "🚕", href: "/coming-soon" },
];

const TRUST_BADGES = [
  { key: "support", icon: "🎧" },
  { key: "bestPrice", icon: "🛡" },
  { key: "secureBooking", icon: "🔒" },
  { key: "easyPayments", icon: "💳" },
];

function HomeContent() {
  const t = useTranslations("HomePage");
  const services = useTranslations("Services");
  const trust = useTranslations("TrustBadges");

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <div className="relative flex w-full items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1687992176093-6417a93fa3d0?auto=format&fit=crop&w=1600&q=75"
          alt=""
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/85 via-primary-800/80 to-primary-700/85" />
        <div className="relative mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-8 px-6 pb-16 pt-14 sm:pb-24 sm:pt-20">
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
          <div id="search" className="w-full scroll-mt-24">
            <SearchWidget />
          </div>
        </div>
      </div>

      <div id="promotions" className="flex w-full max-w-5xl scroll-mt-20 flex-col items-center gap-8 px-6 pt-10">
        <PromotionsBanner />
      </div>

      <div className="flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-12">
        <h2 className="text-2xl font-semibold text-black dark:text-white">{t("categoriesHeading")}</h2>
        <CategoryCards />
      </div>

      <div className="flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-12">
        <h2 className="text-2xl font-semibold text-black dark:text-white">{t("servicesHeading")}</h2>
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {SERVICES.map((service) => (
            <Link
              key={service.key}
              href={service.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-primary-900/40"
            >
              <span className="text-2xl" aria-hidden>
                {service.icon}
              </span>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {services(service.key)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-5xl flex-col gap-6 border-t border-zinc-200 px-6 py-12 dark:border-zinc-800">
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.key} className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                {badge.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-black dark:text-white">{trust(`${badge.key}.title`)}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">{trust(`${badge.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
