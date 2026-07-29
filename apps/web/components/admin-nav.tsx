"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const LINKS = [
  { key: "promotions", href: "/admin/promotions" },
  { key: "heroSlides", href: "/admin/hero-slides" },
  { key: "destinationCards", href: "/admin/destination-cards" },
];

/** Simple tab strip so an owner can jump between the 3 content-management pages - no full admin shell needed for this small a surface. */
export function AdminNav() {
  const t = useTranslations("Admin");
  const pathname = usePathname();

  return (
    <nav className="flex w-full max-w-2xl gap-4 border-b border-zinc-200 pb-3 text-sm font-medium">
      {LINKS.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          className={pathname === link.href ? "text-primary-700 underline" : "text-zinc-600 hover:text-primary-700"}
        >
          {t(`nav.${link.key}`)}
        </Link>
      ))}
    </nav>
  );
}
