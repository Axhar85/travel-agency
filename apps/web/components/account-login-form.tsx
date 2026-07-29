"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { login } from "@/lib/api";
import { cardClass, inputClass, labelClass } from "@/lib/ui";
import { Button } from "./ui/button";

export function AccountLoginForm() {
  const t = useTranslations("Account");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.push("/account/bookings");
    } catch {
      // Same rule as the admin login form - a wrong password and an unknown
      // email both surface as one generic message, not backend detail.
      setError(t("loginError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex w-full max-w-sm flex-col gap-4 p-6 ${cardClass}`}>
      <h1 className="text-xl font-semibold text-black">{t("loginTitle")}</h1>
      <label className="flex flex-col gap-1 text-sm">
        <span className={labelClass}>{t("email")}</span>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className={labelClass}>{t("password")}</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
      </label>
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t("loggingIn") : t("login")}
      </Button>
      <p className="text-center text-sm text-zinc-600">
        {t("noAccount")}{" "}
        <Link href="/account/register" className="font-medium text-primary-700 underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}
