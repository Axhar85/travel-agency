"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import type { PromoCardData } from "@/lib/types";

interface PromoCardsProps {
  cards: PromoCardData[];
}

export function PromoCards({ cards }: PromoCardsProps) {
  const t = useTranslations("PromoCards");
  const locale = useLocale();

  if (cards.length === 0) return null;

  return (
    <div id="promo-cards" className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const title = locale === "es" ? card.titleEs : card.titleEn;
        const subtitle = locale === "es" ? card.subtitleEs : card.subtitleEn;
        return (
          <Link
            key={card.id}
            href={card.linkUrl}
            className="group relative flex h-48 flex-col justify-end overflow-hidden rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-md lg:h-96"
          >
            <Image
              src={`${card.imageUrl}?auto=format&fit=crop&w=640&q=70`}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="relative flex flex-col gap-2">
              <h3 className="text-lg font-semibold text-white">{title}</h3>
              <p className="text-sm text-white/80">{subtitle}</p>
              <span className="text-sm font-semibold text-white underline underline-offset-2">
                {t("explore")}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
