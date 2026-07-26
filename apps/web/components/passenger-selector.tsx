"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CabinClass } from "@/lib/types";
import { inputClass, labelClass } from "@/lib/ui";

export interface PassengerCounts {
  adults: number;
  children: number;
  infants: number;
  cabinClass: CabinClass;
}

interface PassengerSelectorProps {
  value: PassengerCounts;
  onChange: (value: PassengerCounts) => void;
}

const CABIN_CLASSES: CabinClass[] = ["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"];

function Counter({
  label,
  hint,
  count,
  min,
  max,
  onDecrement,
  onIncrement,
}: {
  label: string;
  hint: string;
  count: number;
  min: number;
  max: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-sm font-medium text-black dark:text-white">{label}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={count <= min}
          onClick={onDecrement}
          aria-label={`decrease ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-transparent dark:border-zinc-600 dark:text-primary-300 dark:hover:bg-primary-900/40"
        >
          −
        </button>
        <span className="w-4 text-center text-sm text-black dark:text-white">{count}</span>
        <button
          type="button"
          disabled={count >= max}
          onClick={onIncrement}
          aria-label={`increase ${label}`}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 disabled:opacity-30 disabled:hover:bg-transparent dark:border-zinc-600 dark:text-primary-300 dark:hover:bg-primary-900/40"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function PassengerSelector({ value, onChange }: PassengerSelectorProps) {
  const t = useTranslations("SearchForm");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalPassengers = value.adults + value.children + value.infants;

  function update(patch: Partial<PassengerCounts>) {
    const next = { ...value, ...patch };
    // Each infant must travel on an adult's lap - never allow infants > adults.
    if (next.infants > next.adults) next.infants = next.adults;
    onChange(next);
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <span className={labelClass}>{t("passengers")}</span>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={`text-left ${inputClass}`}
      >
        {totalPassengers} · {t(`cabinClasses.${value.cabinClass}`)}
      </button>
      {isOpen && (
        <div className="absolute top-full z-10 mt-1 w-72 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:divide-zinc-700 dark:border-zinc-700 dark:bg-zinc-900">
          <Counter
            label={t("adults")}
            hint={t("adultsHint")}
            count={value.adults}
            min={1}
            max={9}
            onDecrement={() => update({ adults: value.adults - 1 })}
            onIncrement={() => update({ adults: value.adults + 1 })}
          />
          <Counter
            label={t("children")}
            hint={t("childrenHint")}
            count={value.children}
            min={0}
            max={9}
            onDecrement={() => update({ children: value.children - 1 })}
            onIncrement={() => update({ children: value.children + 1 })}
          />
          <Counter
            label={t("infants")}
            hint={t("infantsHint")}
            count={value.infants}
            min={0}
            max={value.adults}
            onDecrement={() => update({ infants: value.infants - 1 })}
            onIncrement={() => update({ infants: value.infants + 1 })}
          />
          <div className="pt-3">
            <label className="mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400">{t("cabinClass")}</label>
            <select
              value={value.cabinClass}
              onChange={(event) => update({ cabinClass: event.target.value as CabinClass })}
              className={`w-full py-1.5 ${inputClass}`}
            >
              {CABIN_CLASSES.map((cabinClass) => (
                <option key={cabinClass} value={cabinClass}>
                  {t(`cabinClasses.${cabinClass}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="pt-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-400"
            >
              {t("done")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
