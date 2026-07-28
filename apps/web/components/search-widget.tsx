"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { cardClass } from "@/lib/ui";
import { SearchForm } from "./search-form";

type Tab = "flights" | "hotels" | "hajjUmrah" | "holidays";

const TABS: Tab[] = ["flights", "hotels", "hajjUmrah", "holidays"];

const TAB_ICONS: Record<Tab, string> = {
  flights: "✈",
  hotels: "🏨",
  hajjUmrah: "🕋",
  holidays: "🏖",
};

export function SearchWidget() {
  const t = useTranslations("SearchWidget");
  const [tab, setTab] = useState<Tab>("flights");

  return (
    <div className={`w-full overflow-hidden ${cardClass}`}>
      <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
              tab === value
                ? "border-b-2 border-primary-600 text-primary-700 dark:text-primary-300"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            <span aria-hidden>{TAB_ICONS[value]}</span>
            {t(`tabs.${value}`)}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        {tab === "flights" && <SearchForm />}
        {tab === "hajjUmrah" && <SearchForm defaultDestination="JED" />}
        {(tab === "hotels" || tab === "holidays") && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <p className="text-base font-medium text-black dark:text-white">{t("comingSoonTitle")}</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("comingSoonBody")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
