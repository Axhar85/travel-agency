"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/app/[locale]/locale-switcher";

interface NavLink {
  key: string;
  href: string;
}

const NAV_LINKS: NavLink[] = [
  { key: "flights", href: "/" },
  { key: "hotels", href: "/coming-soon" },
  { key: "hajjUmrah", href: "/hajj-umrah" },
  { key: "holidays", href: "/coming-soon" },
  { key: "offers", href: "/#promotions" },
  { key: "destinations", href: "/#destinations" },
  { key: "travelGuide", href: "/coming-soon" },
];

export function SiteHeader() {
  const t = useTranslations("Nav");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-1.5 text-xl font-bold text-primary-700 dark:text-primary-300">
          <span aria-hidden>✈</span>
          {t("logo")}
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-medium text-zinc-700 dark:text-zinc-300 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.key} href={link.href} className="transition-colors hover:text-primary-700 dark:hover:text-primary-300">
              {t(link.key)}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:block">
          <LocaleSwitcher />
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={t("menu")}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300 lg:hidden"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </div>

      {mobileOpen && (
        <nav aria-label="Main mobile" className="flex flex-col gap-1 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800 lg:hidden">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-primary-50 dark:text-zinc-300 dark:hover:bg-primary-900/40"
            >
              {t(link.key)}
            </Link>
          ))}
          <div className="px-2 pt-2">
            <LocaleSwitcher />
          </div>
        </nav>
      )}
    </header>
  );
}
