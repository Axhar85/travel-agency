"use client";

import { useTranslations } from "next-intl";
import type { Passenger, PassengerType } from "@/lib/types";

function toUppercase(value: string): string {
  return value.toUpperCase();
}

interface PassengerFormProps {
  index: number;
  type: PassengerType;
  value: Passenger;
  onChange: (value: Passenger) => void;
}

export function PassengerForm({ index, type, value, onChange }: PassengerFormProps) {
  const t = useTranslations("PassengerForm");
  const isAdult = type === "ADULT";

  function update(patch: Partial<Passenger>) {
    onChange({ ...value, ...patch });
  }

  function updateDocument(patch: Partial<NonNullable<Passenger["document"]>>) {
    onChange({
      ...value,
      document: {
        documentType: "PASSPORT",
        number: "",
        expiryDate: "",
        issuanceCountry: "",
        nationality: "",
        holder: true,
        ...value.document,
        ...patch,
      },
    });
  }

  return (
    <fieldset className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <legend className="px-1 text-sm font-semibold text-black dark:text-white">
        {t("passengerLabel", { number: index + 1, type: t(`type${type.charAt(0)}${type.slice(1).toLowerCase()}`) })}
      </legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("firstName")}</span>
          <input
            type="text"
            required
            value={value.firstName}
            onChange={(event) => update({ firstName: toUppercase(event.target.value) })}
            pattern="[A-Za-z\s'-]{1,50}"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("lastName")}</span>
          <input
            type="text"
            required
            value={value.lastName}
            onChange={(event) => update({ lastName: toUppercase(event.target.value) })}
            pattern="[A-Za-z\s'-]{1,50}"
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("dateOfBirth")}</span>
          <input
            type="date"
            required
            value={value.dateOfBirth}
            onChange={(event) => update({ dateOfBirth: event.target.value })}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("gender")}</span>
          <select
            value={value.gender}
            onChange={(event) => update({ gender: event.target.value as Passenger["gender"] })}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
          >
            <option value="MALE">{t("genderMale")}</option>
            <option value="FEMALE">{t("genderFemale")}</option>
          </select>
        </label>

        {isAdult && (
          <>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("email")}</span>
              <input
                type="email"
                required
                value={value.email ?? ""}
                onChange={(event) => update({ email: event.target.value })}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("phone")}</span>
              <input
                type="tel"
                required
                value={value.phone ?? ""}
                onChange={(event) => update({ phone: event.target.value })}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
              />
            </label>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t("passportSection")}</span>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("passportNumber")}</span>
            <input
              type="text"
              required
              value={value.document?.number ?? ""}
              onChange={(event) => updateDocument({ number: toUppercase(event.target.value) })}
              pattern="[A-Za-z0-9]{5,20}"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("passportExpiry")}</span>
            <input
              type="date"
              required
              value={value.document?.expiryDate ?? ""}
              onChange={(event) => updateDocument({ expiryDate: event.target.value })}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-black dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("passportIssuanceCountry")}</span>
            <input
              type="text"
              required
              maxLength={2}
              value={value.document?.issuanceCountry ?? ""}
              onChange={(event) => updateDocument({ issuanceCountry: toUppercase(event.target.value) })}
              pattern="[A-Za-z]{2}"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 uppercase text-black dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">{t("nationality")}</span>
            <input
              type="text"
              required
              maxLength={2}
              value={value.document?.nationality ?? ""}
              onChange={(event) => updateDocument({ nationality: toUppercase(event.target.value) })}
              pattern="[A-Za-z]{2}"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 uppercase text-black dark:border-zinc-700 dark:bg-black dark:text-white"
            />
          </label>
        </div>
      </div>
    </fieldset>
  );
}
