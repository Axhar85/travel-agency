import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { CategoryCards } from "@/components/category-cards";
import { HeroCarousel } from "@/components/hero-carousel";
import { PromotionsBanner } from "@/components/promotions-banner";
import { SearchWidget } from "@/components/search-widget";
import { getDestinationCards, getHeroSlides } from "@/lib/api";
import type { DestinationCardData, HeroSlideData } from "@/lib/types";

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

  // Fetched here (not inside HeroCarousel/CategoryCards) so a fetch failure
  // can fall back to an empty list without taking down the homepage -
  // matches PromotionsBanner's try/catch-and-skip pattern.
  let slides: HeroSlideData[] = [];
  let cards: DestinationCardData[] = [];
  try {
    [slides, cards] = await Promise.all([getHeroSlides(), getDestinationCards()]);
  } catch {
    // leave both empty - HeroCarousel/CategoryCards render nothing rather than crash
  }

  return <HomeContent slides={slides} cards={cards} />;
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

interface HomeContentProps {
  slides: HeroSlideData[];
  cards: DestinationCardData[];
}

function HomeContent({ slides, cards }: HomeContentProps) {
  const t = useTranslations("HomePage");
  const services = useTranslations("Services");
  const trust = useTranslations("TrustBadges");

  return (
    <div className="flex flex-1 flex-col items-center font-sans">
      <HeroCarousel slides={slides} />

      <div id="search" className="-mt-10 w-full max-w-6xl scroll-mt-24 px-4 sm:-mt-14 sm:px-6">
        <SearchWidget />
      </div>

      <div id="promotions" className="flex w-full max-w-6xl scroll-mt-20 flex-col items-center gap-8 px-6 pt-10">
        <PromotionsBanner />
      </div>

      <div className="flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-12">
        <h2 className="text-2xl font-semibold text-black">{t("categoriesHeading")}</h2>
        <CategoryCards cards={cards} />
      </div>

      <div className="flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-12">
        <h2 className="text-2xl font-semibold text-black">{t("servicesHeading")}</h2>
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-4">
          {SERVICES.map((service) => (
            <Link
              key={service.key}
              href={service.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-white p-4 text-center transition-colors hover:border-primary-300 hover:bg-primary-50"
            >
              <span className="text-2xl" aria-hidden>
                {service.icon}
              </span>
              <span className="text-sm font-medium text-zinc-700">
                {services(service.key)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="flex w-full max-w-6xl flex-col gap-6 border-t border-zinc-200 px-6 py-12">
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_BADGES.map((badge) => (
            <div key={badge.key} className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden>
                {badge.icon}
              </span>
              <div>
                <p className="text-sm font-semibold text-black">{trust(`${badge.key}.title`)}</p>
                <p className="text-sm text-zinc-600">{trust(`${badge.key}.body`)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
