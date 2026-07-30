"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "./ui/button";

const STORAGE_KEY = "naafi-cookie-consent";

// "accepted" vs "necessary-only" only matters once a non-essential cookie
// (analytics, marketing) actually exists to gate - today this app sets only
// the required session cookie, so both choices currently behave the same.
// The distinction is stored now so that future code (e.g. an analytics
// script) can check localStorage.getItem(STORAGE_KEY) === "accepted" before
// loading, without needing to touch this banner again.
type Consent = "accepted" | "necessary-only";

export function CookieConsentBanner() {
  const t = useTranslations("CookieConsent");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR/initial render - this has to
    // be an effect, not a useState initializer, to avoid a hydration mismatch.
    const stored = window.localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!stored) setVisible(true);
  }, []);

  function choose(consent: Consent) {
    window.localStorage.setItem(STORAGE_KEY, consent);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4">
      <div className="flex w-full max-w-2xl flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="text-sm text-zinc-700">
          {t("message")}{" "}
          <Link href="/cookie-policy" className="font-medium text-primary-700 underline">
            {t("learnMore")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose("necessary-only")}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
          >
            {t("necessaryOnly")}
          </button>
          <Button type="button" onClick={() => choose("accepted")} className="px-4 py-2">
            {t("acceptAll")}
          </Button>
        </div>
      </div>
    </div>
  );
}
