"use client";

import { useLocale, useTranslations } from "next-intl";
import { routing } from "@/i18n/routing";
import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const activeLocale = useLocale();
  const pathname = usePathname();

  return (
    <nav aria-label="Language" className="flex gap-3 text-sm">
      {routing.locales.map((locale) => (
        <Link
          key={locale}
          href={pathname}
          locale={locale}
          aria-current={locale === activeLocale ? "true" : undefined}
          className={
            locale === activeLocale
              ? "font-semibold text-black dark:text-white"
              : "text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-white"
          }
        >
          {t(locale)}
        </Link>
      ))}
    </nav>
  );
}
