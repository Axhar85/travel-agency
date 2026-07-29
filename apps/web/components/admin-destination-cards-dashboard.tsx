"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  ApiError,
  createDestinationCard,
  deleteDestinationCard,
  getAllDestinationCards,
  reorderDestinationCards,
  updateDestinationCard,
} from "@/lib/api";
import { cardClass, inputClass, labelClass } from "@/lib/ui";
import type { DestinationCardData } from "@/lib/types";
import { Button } from "./ui/button";

export function AdminDestinationCardsDashboard() {
  const t = useTranslations("Admin");
  const router = useRouter();

  const [cards, setCards] = useState<DestinationCardData[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [titleEs, setTitleEs] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [subtitleEs, setSubtitleEs] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function load() {
    try {
      const list = await getAllDestinationCards();
      setCards(list);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        router.push("/admin/login");
        return;
      }
      setLoadError(true);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    if (!imageFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      await createDestinationCard(imageFile, { titleEs, titleEn, subtitleEs, subtitleEn, linkUrl });
      setImageFile(null);
      setTitleEs("");
      setTitleEn("");
      setSubtitleEs("");
      setSubtitleEn("");
      setLinkUrl("");
      await load();
    } catch {
      setUploadError(t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleActive(card: DestinationCardData) {
    await updateDestinationCard(card.id, { isActive: !card.isActive });
    await load();
  }

  async function handleDelete(id: string) {
    await deleteDestinationCard(id);
    await load();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!cards) return;
    const target = index + direction;
    if (target < 0 || target >= cards.length) return;
    const reordered = [...cards];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setCards(reordered);
    await reorderDestinationCards(reordered.map((c) => c.id));
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{t("loadError")}</p>;
  }

  if (!cards) {
    return <p className="text-sm text-zinc-600">{t("loading")}</p>;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold text-black">{t("destinationCardsTitle")}</h1>

      <form onSubmit={handleUpload} className={`flex flex-col gap-4 p-4 ${cardClass}`}>
        <h2 className="text-sm font-semibold text-primary-800">{t("uploadTitle")}</h2>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelClass}>{t("image")}</span>
          <input
            type="file"
            accept="image/*"
            required
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className={labelClass}>{t("titleEs")}</span>
            <input
              type="text"
              required
              value={titleEs}
              onChange={(event) => setTitleEs(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className={labelClass}>{t("titleEn")}</span>
            <input
              type="text"
              required
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className={labelClass}>{t("subtitleEs")}</span>
            <input
              type="text"
              required
              value={subtitleEs}
              onChange={(event) => setSubtitleEs(event.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className={labelClass}>{t("subtitleEn")}</span>
            <input
              type="text"
              required
              value={subtitleEn}
              onChange={(event) => setSubtitleEn(event.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelClass}>{t("linkUrlRequired")}</span>
          <input
            type="text"
            required
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="/search?origin=MAD&destination=LHE&departureDate=2026-09-01&adults=1&cabinClass=ECONOMY"
            className={inputClass}
          />
          <span className="text-xs text-zinc-500">{t("linkUrlHint")}</span>
        </label>
        {uploadError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            {uploadError}
          </div>
        )}
        <Button type="submit" disabled={uploading || !imageFile} className="self-start px-5 py-2">
          {uploading ? t("uploading") : t("upload")}
        </Button>
      </form>

      <div className="flex flex-col gap-3">
        {cards.length === 0 && <p className="text-sm text-zinc-600">{t("noDestinationCards")}</p>}
        {cards.map((card, index) => (
          <div key={card.id} className={`flex items-center gap-3 p-3 ${cardClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only tool, arbitrary owner-uploaded Blob URLs */}
            <img src={card.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-black">{card.titleEs}</span>
              <span className="text-xs text-zinc-500">
                {card.isActive ? t("active") : t("inactive")}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void handleMove(index, -1)}
                disabled={index === 0}
                aria-label={t("moveUp")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-primary-700 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => void handleMove(index, 1)}
                disabled={index === cards.length - 1}
                aria-label={t("moveDown")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-primary-700 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void handleToggleActive(card)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {card.isActive ? t("hide") : t("show")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(card.id)}
                className="rounded-full border border-red-300 px-3 py-1 text-xs font-medium text-red-700"
              >
                {t("delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
