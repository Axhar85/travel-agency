"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function searchHref(destination: string): string {
  return `/search?origin=MAD&destination=${destination}&departureDate=${addDays(30)}&adults=1&cabinClass=ECONOMY`;
}

interface Category {
  key: string;
  href: string;
  image: string;
}

// Free-to-use Unsplash photos (license permits commercial use/hotlinking,
// verified non-"Unsplash+" at the time these were picked) - representative
// imagery for each region until real photography is available.
const CATEGORIES: Category[] = [
  {
    key: "southAsia",
    href: searchHref("LHE"),
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523",
  },
  {
    key: "philippines",
    href: searchHref("MNL"),
    image: "https://images.unsplash.com/photo-1709486851809-ca174bfed7ed",
  },
  {
    key: "latinAmerica",
    href: searchHref("GIG"),
    image: "https://images.unsplash.com/photo-1518639192441-8fce0a366e2e",
  },
  {
    key: "hajjUmrah",
    href: "/hajj-umrah",
    image: "https://images.unsplash.com/photo-1513072064285-240f87fa81e8",
  },
];

export function CategoryCards() {
  const t = useTranslations("Categories");

  return (
    <div id="destinations" className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CATEGORIES.map((category) => (
        <Link
          key={category.key}
          href={category.href}
          className="group relative flex h-48 flex-col justify-end overflow-hidden rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md"
        >
          <Image
            src={`${category.image}?auto=format&fit=crop&w=640&q=70`}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="relative flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-white">{t(`${category.key}.title`)}</h3>
            <p className="text-sm text-white/80">{t(`${category.key}.subtitle`)}</p>
            <span className="text-sm font-semibold text-white underline underline-offset-2">
              {t("explore")}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
