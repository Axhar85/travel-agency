"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatPrice } from "@/lib/format";
import type { PricedOffer } from "@/lib/types";
import { Button } from "./ui/button";

interface PriceConfirmationProps {
  pricedOffer: PricedOffer;
  onBack: () => void;
  onContinue: () => void;
  isContinuing: boolean;
}

export function PriceConfirmation({ pricedOffer, onBack, onContinue, isContinuing }: PriceConfirmationProps) {
  const t = useTranslations("SearchResults");
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-lg font-semibold text-black">{t("confirmPrice")}</h2>

      {pricedOffer.priceChanged ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          {t("priceChanged", {
            original: formatPrice(pricedOffer.originalTotal, pricedOffer.price.currency, locale),
            updated: formatPrice(pricedOffer.price.total, pricedOffer.price.currency, locale),
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-900">
          {t("priceConfirmed")}
        </div>
      )}

      <span className="text-2xl font-semibold text-accent-700">
        {formatPrice(pricedOffer.price.total, pricedOffer.price.currency, locale)}
      </span>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={onBack} disabled={isContinuing} className="flex-1 px-5 py-2.5">
          {t("backToResults")}
        </Button>
        <Button type="button" onClick={onContinue} disabled={isContinuing} className="flex-1 px-5 py-2.5">
          {isContinuing ? t("startingBooking") : t("continue")}
        </Button>
      </div>
    </div>
  );
}
