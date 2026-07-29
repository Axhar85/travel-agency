"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { inputClass } from "@/lib/ui";

interface FooterLink {
  key: string;
  href: string;
}

function FooterColumn({ heading, links }: { heading: string; links: FooterLink[] }) {
  const t = useTranslations("Footer");
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-black dark:text-white">{heading}</h3>
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.key}>
            <Link href={link.href} className="text-sm text-zinc-600 hover:text-primary-700 dark:text-zinc-400 dark:hover:text-primary-300">
              {t(link.key)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

const QUICK_LINKS: FooterLink[] = [
  { key: "aboutUs", href: "/coming-soon" },
  { key: "contactUs", href: "/coming-soon" },
  { key: "faqs", href: "/coming-soon" },
  { key: "blog", href: "/coming-soon" },
  { key: "careers", href: "/coming-soon" },
];

const DESTINATION_LINKS: { key: string; origin: string; destination: string }[] = [
  { key: "pakistan", origin: "MAD", destination: "LHE" },
  { key: "india", origin: "MAD", destination: "DEL" },
  { key: "bangladesh", origin: "MAD", destination: "DAC" },
  { key: "philippines", origin: "MAD", destination: "MNL" },
  { key: "latinAmerica", origin: "MAD", destination: "GIG" },
  { key: "middleEast", origin: "MAD", destination: "JED" },
];

const HAJJ_UMRAH_LINKS: FooterLink[] = [
  { key: "hajjPackages", href: "/hajj-umrah" },
  { key: "umrahPackages", href: "/hajj-umrah" },
  { key: "visaInformation", href: "/coming-soon" },
  { key: "guidelines", href: "/coming-soon" },
  { key: "ziyaratTours", href: "/coming-soon" },
];

const SUPPORT_LINKS: FooterLink[] = [
  { key: "helpCenter", href: "/coming-soon" },
  { key: "bookingSupport", href: "/coming-soon" },
  { key: "changeBooking", href: "/coming-soon" },
  { key: "refundPolicy", href: "/coming-soon" },
];

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function SiteFooter() {
  const t = useTranslations("Footer");
  const nav = useTranslations("Nav");
  const [subscribed, setSubscribed] = useState(false);

  const destinationLinks = DESTINATION_LINKS.map((link) => ({
    key: link.key,
    href: `/search?origin=${link.origin}&destination=${link.destination}&departureDate=${addDays(30)}&adults=1&cabinClass=ECONOMY`,
  }));

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-3 lg:grid-cols-6">
        <div className="col-span-2 flex flex-col gap-3 sm:col-span-3 lg:col-span-1">
          <span className="flex items-center gap-1.5 text-lg font-bold text-primary-700 dark:text-primary-300">
            <span aria-hidden>✈</span>
            {nav("logo")}
          </span>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("tagline")}</p>
        </div>

        <FooterColumn heading={t("quickLinks")} links={QUICK_LINKS} />
        <FooterColumn heading={t("topDestinations")} links={destinationLinks} />
        <FooterColumn heading={t("hajjUmrah")} links={HAJJ_UMRAH_LINKS} />
        <FooterColumn heading={t("support")} links={SUPPORT_LINKS} />

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-black dark:text-white">{t("contactUs")}</h3>
          <ul className="flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>{t("addPhone")}</li>
            <li>{t("addEmail")}</li>
            <li>{t("addAddress")}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-zinc-200 px-6 py-8 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h3 className="text-sm font-semibold text-black dark:text-white">{t("stayUpdated")}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("newsletterHint")}</p>
          </div>
          {subscribed ? (
            <p className="text-sm font-medium text-primary-700 dark:text-primary-300">{t("newsletterComingSoon")}</p>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setSubscribed(true);
              }}
              className="flex w-full max-w-sm gap-2"
            >
              <input
                type="email"
                required
                placeholder={t("emailPlaceholder")}
                className={`flex-1 ${inputClass}`}
              />
              <button
                type="submit"
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
              >
                {t("subscribe")}
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-zinc-200 px-6 py-6 dark:border-zinc-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row">
          <span>{t("copyright", { year: new Date().getFullYear(), brand: nav("logo") })}</span>
          <div className="flex gap-4">
            <Link href="/coming-soon" className="hover:text-primary-700 dark:hover:text-primary-300">
              {t("terms")}
            </Link>
            <Link href="/coming-soon" className="hover:text-primary-700 dark:hover:text-primary-300">
              {t("privacy")}
            </Link>
            <Link href="/cookie-policy" className="hover:text-primary-700 dark:hover:text-primary-300">
              {t("cookiePolicy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
