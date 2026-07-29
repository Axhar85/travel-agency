"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { searchCardClass } from "@/lib/ui";
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

  // No overflow-hidden here - the floating airport/passenger dropdowns are
  // absolutely positioned children that must escape this box's bounds on the
  // single-row desktop layout, where the box itself is only one row tall.
  // overflow-hidden would clip them to a sliver instead of letting them
  // float over the page below.
  return (
    <div className={`w-full ${searchCardClass}`}>
      <div className="flex overflow-x-auto rounded-t-2xl border-b border-zinc-200">
        {TABS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 text-sm font-medium transition-colors ${
              tab === value
                ? "border-b-2 border-primary-600 text-primary-700"
                : "text-zinc-500 hover:text-zinc-700"
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
            <p className="text-base font-medium text-black">{t("comingSoonTitle")}</p>
            <p className="text-sm text-zinc-600">{t("comingSoonBody")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
