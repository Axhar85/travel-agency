"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  ApiError,
  createHeroSlide,
  deleteHeroSlide,
  getAllHeroSlides,
  reorderHeroSlides,
  updateHeroSlide,
} from "@/lib/api";
import { cardClass, inputClass, labelClass } from "@/lib/ui";
import type { HeroSlideData } from "@/lib/types";
import { Button } from "./ui/button";

export function AdminHeroSlidesDashboard() {
  const t = useTranslations("Admin");
  const router = useRouter();

  const [slides, setSlides] = useState<HeroSlideData[] | null>(null);
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
      const list = await getAllHeroSlides();
      setSlides(list);
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
      await createHeroSlide(imageFile, { titleEs, titleEn, subtitleEs, subtitleEn, linkUrl });
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

  async function handleToggleActive(slide: HeroSlideData) {
    await updateHeroSlide(slide.id, { isActive: !slide.isActive });
    await load();
  }

  async function handleDelete(id: string) {
    await deleteHeroSlide(id);
    await load();
  }

  async function handleMove(index: number, direction: -1 | 1) {
    if (!slides) return;
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const reordered = [...slides];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setSlides(reordered);
    await reorderHeroSlides(reordered.map((s) => s.id));
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{t("loadError")}</p>;
  }

  if (!slides) {
    return <p className="text-sm text-zinc-600">{t("loading")}</p>;
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <h1 className="text-xl font-semibold text-black">{t("heroSlidesTitle")}</h1>

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
            placeholder="/hajj-umrah"
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
        {slides.length === 0 && <p className="text-sm text-zinc-600">{t("noHeroSlides")}</p>}
        {slides.map((slide, index) => (
          <div key={slide.id} className={`flex items-center gap-3 p-3 ${cardClass}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- admin-only tool, arbitrary owner-uploaded Blob URLs */}
            <img src={slide.imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-medium text-black">{slide.titleEs}</span>
              <span className="text-xs text-zinc-500">
                {slide.isActive ? t("active") : t("inactive")}
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
                disabled={index === slides.length - 1}
                aria-label={t("moveDown")}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-primary-700 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void handleToggleActive(slide)}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700"
              >
                {slide.isActive ? t("hide") : t("show")}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(slide.id)}
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
