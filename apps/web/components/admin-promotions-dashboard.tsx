"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  ApiError,
  createPromotion,
  deletePromotion,
  getAllPromotions,
  reorderPromotions,
  updatePromotion,
} from "@/lib/api";
import { cardClass, inputClass, labelClass } from "@/lib/ui";
import type { Promotion } from "@/lib/types";
import { Button } from "./ui/button";

export function AdminPromotionsDashboard() {
  const t = useTranslations("Admin");
  const router = useRouter();

  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function load() {
    try {
      const list = await getAllPromotions();
      setPromotions(list);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        router.push("/admin/login");
        return;
      }
      setLoadError(true);
    }
  }

  useEffect(() => {
    // Standard "fetch on mount" effect (see
    // https://react.dev/learn/you-might-not-need-an-effect#fetching-data) -
    // the lint rule flags the setState calls inside load() as a false
    // positive here.
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
      await createPromotion(imageFile, title, linkUrl);
      setImageFile(null);
      setTitle("");
      setLinkUrl("");
      await load();
    } catch {
      setUploadError(t("uploadError"));
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleActive(promotion: Promotion) {
    await updatePromotion(promotion.id, { isActive: !promotion.isActive });
    await load();
  }

  async function handleDelete(id: string) {
    await deletePromotion(id);
    await load();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!promotions) return;
    const target = index + direction;
    if (target < 0 || target >= promotions.length) return;
    const reordered = [...promotions];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPromotions(reordered);
    await reorderPromotions(reordered.map((p) => p.id));
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{t("loadError")}</p>;
  }

  if (!promotions) {
    return <p className="text-sm text-zinc-600">{t("loading")}</p>;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold text-black">{t("promotionsTitle")}</h1>

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
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelClass}>{t("promotionTitleLabel")}</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className={labelClass}>{t("linkUrl")}</span>
          <input
            type="url"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
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
        {promotions.length === 0 && (
          <p className="text-sm text-zinc-600">{t("noPromotions")}</p>
        )}
        {promotions.map((promotion, index) => (
          <div key={promotion.id} className={`flex items-center gap-3 p-3 ${cardClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only tool, arbitrary owner-uploaded Blob URLs, not worth next/image's remotePatterns coupling here */}
            <img src={promotion.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-black">
                {promotion.title || t("untitled")}
              </span>
              <span className="text-xs text-zinc-500">
                {promotion.isActive ? t("active") : t("inactive")}
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
                disabled={index === promotions.length - 1}
                aria-label={t("moveDown")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-primary-700 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void handleToggleActive(promotion)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {promotion.isActive ? t("hide") : t("show")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(promotion.id)}
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
