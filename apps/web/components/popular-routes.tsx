"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { airports } from "@/data/airports";

// Curated, not derived from booking data (there isn't any yet) - the routes
// that actually define this agency's business: South Asian/Filipino
// diaspora travel out of Spain, plus the two Hajj/Umrah gateways.
const POPULAR_ROUTE_CODES = ["LHE", "KHI", "ISB", "DEL", "BOM", "DAC", "MNL", "JED", "MED"];

const DEFAULT_ORIGIN = "MAD";

function defaultDepartureDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export function PopularRoutes() {
  const t = useTranslations("HomePage");
  const locale = useLocale();
  const departureDate = defaultDepartureDate();

  const routes = POPULAR_ROUTE_CODES.map((code) => airports.find((a) => a.code === code)).filter(
    (a): a is NonNullable<typeof a> => a !== undefined,
  );

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{t("popularRoutes")}</span>
      <div className="flex flex-wrap justify-center gap-2">
        {routes.map((airport) => (
          <Link
            key={airport.code}
            href={`/search?origin=${DEFAULT_ORIGIN}&destination=${airport.code}&departureDate=${departureDate}&adults=1&cabinClass=ECONOMY`}
            className="rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-800 transition-colors hover:border-primary-300 hover:bg-primary-100 dark:border-primary-800 dark:bg-primary-900/40 dark:text-primary-200 dark:hover:bg-primary-900/70"
          >
            {locale === "es" ? airport.city.es : airport.city.en}
          </Link>
        ))}
      </div>
    </div>
  );
}
