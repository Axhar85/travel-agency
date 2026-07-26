"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { adminLogin } from "@/lib/api";
import { cardClass, inputClass, labelClass } from "@/lib/ui";
import { Button } from "./ui/button";

export function AdminLoginForm() {
  const t = useTranslations("Admin");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await adminLogin(password);
      router.push("/admin/promotions");
    } catch {
      // Backend messages here are English-only and not meant for direct
      // display (same rule as the rest of the app) - a wrong password and a
      // rate-limited IP both surface as one generic message.
      setError(t("loginError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex w-full max-w-sm flex-col gap-4 p-6 ${cardClass}`}>
      <h1 className="text-xl font-semibold text-black dark:text-white">{t("loginTitle")}</h1>
      <label className="flex flex-col gap-1 text-sm">
        <span className={labelClass}>{t("password")}</span>
        <input
          type="password"
          required
          autoFocus
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t("loggingIn") : t("login")}
      </Button>
    </form>
  );
}
