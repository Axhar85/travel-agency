"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import type { HeroSlideData } from "@/lib/types";

const AUTO_ADVANCE_MS = 6000;

interface HeroCarouselProps {
  slides: HeroSlideData[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const t = useTranslations("Hero");
  const home = useTranslations("HomePage");
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || slides.length === 0) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [paused, slides.length]);

  function goTo(next: number) {
    setIndex((next + slides.length) % slides.length);
  }

  // No fallback content - the seed script populates initial rows at
  // migration time, so an empty list here means every slide was
  // deactivated deliberately from the admin panel.
  if (slides.length === 0) return null;

  const slide = slides[index];
  const title = locale === "es" ? slide.titleEs : slide.titleEn;
  const subtitle = locale === "es" ? slide.subtitleEs : slide.subtitleEn;

  // Fixed height (not content-driven) so every slide is the same height
  // regardless of how long its title/subtitle text runs - previously the
  // box grew/shrank per slide because nothing but the text content set its
  // height. line-clamp on the title/subtitle below keeps the text block
  // itself bounded so it never overflows this fixed box.
  return (
    <div
      className="relative flex h-[300px] w-full items-center justify-center overflow-hidden sm:h-[380px] lg:h-[420px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {slides.map((s, i) => (
        <Image
          key={s.id}
          src={`${s.imageUrl}?auto=format&fit=crop&w=1600&q=75`}
          alt=""
          fill
          sizes="100vw"
          priority={i === 0}
          className={`object-cover transition-opacity duration-700 ${i === index ? "opacity-100" : "opacity-0"} ${i === 0 ? "" : "absolute inset-0"}`}
        />
      ))}
      {/* Lighter than a first pass at this (was /85 /75 /85) - that made the
          photo nearly invisible under a flat green wash. Text legibility
          comes from the dedicated scrim behind the text block below, not
          from tinting the whole image this heavily. */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary-900/55 via-primary-900/25 to-primary-900/60" />

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label={t("previous")}
            className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30 sm:left-4"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label={t("next")}
            className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur transition-colors hover:bg-white/30 sm:right-4"
          >
            ›
          </button>
        </>
      )}

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6">
        {/* A dedicated scrim behind just the text, not the whole photo -
            keeps the image visible while still guaranteeing white-text
            legibility regardless of how bright the underlying photo is. */}
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-black/35 px-6 py-6 text-center backdrop-blur-sm sm:px-10 sm:py-8">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-300">
            {home("tagline")}
          </span>
          {/* line-clamp keeps every slide's text block the same height even
              though the owner-entered copy lengths differ. */}
          <h1 className="line-clamp-2 max-w-xl text-2xl font-semibold leading-9 tracking-tight text-white sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          <p className="line-clamp-2 max-w-lg text-base leading-7 text-primary-100 sm:text-lg sm:leading-8">
            {subtitle}
          </p>
          <Link
            href={slide.linkUrl}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold text-primary-900 transition-colors hover:bg-accent-400"
          >
            {t("cta")}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              aria-label={t("goToSlide", { number: i + 1 })}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/70"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
