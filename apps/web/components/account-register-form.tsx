"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError, register } from "@/lib/api";
import { cardClass, inputClass, labelClass } from "@/lib/ui";
import { Button } from "./ui/button";

export function AccountRegisterForm() {
  const t = useTranslations("Account");
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ email, password, firstName: firstName || undefined, lastName: lastName || undefined });
      router.push("/account/bookings");
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 409) {
        setError(t("emailTaken"));
      } else {
        setError(t("registerError"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`flex w-full max-w-sm flex-col gap-4 p-6 ${cardClass}`}>
      <h1 className="text-xl font-semibold text-black">{t("registerTitle")}</h1>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelClass}>{t("firstName")}</span>
          <input
            type="text"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelClass}>{t("lastName")}</span>
          <input
            type="text"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className={labelClass}>{t("email")}</span>
        <input
          type="email"
          required
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
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />
        <span className="text-xs text-zinc-500">{t("passwordHint")}</span>
      </label>
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </div>
      )}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? t("registering") : t("register")}
      </Button>
      <p className="text-center text-sm text-zinc-600">
        {t("haveAccount")}{" "}
        <Link href="/account/login" className="font-medium text-primary-700 underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
