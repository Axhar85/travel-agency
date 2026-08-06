"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";

interface LocaleSwitcherProps {
  /** Use light text - for placement over a dark/brand-colored background (e.g. the homepage hero). */
  inverted?: boolean;
}

export function LocaleSwitcher({ inverted = false }: LocaleSwitcherProps) {
  const t = useTranslations("LocaleSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();

  const activeClass = inverted ? "font-semibold text-white" : "font-semibold text-primary-700 dark:text-primary-300";
  const inactiveClass = inverted
    ? "text-primary-200 hover:text-white"
    : "text-zinc-500 hover:text-primary-700 dark:text-zinc-400 dark:hover:text-primary-300";

  return (
    <nav aria-label="Language" className="flex gap-3 text-base">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={locale === activeLocale ? "true" : undefined}
          className={locale === activeLocale ? activeClass : inactiveClass}
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
