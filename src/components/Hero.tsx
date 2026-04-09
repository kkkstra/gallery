"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "./LocaleProvider";

interface HeroProps {
  imageSrc: string;
  subtitle?: string;
  subtitleZh?: string;
  title?: string;
  titleZh?: string;
  description?: string;
  descriptionZh?: string;
  ctaText?: string;
  ctaTextZh?: string;
}

export default function Hero({
  imageSrc,
  subtitle,
  subtitleZh,
  title,
  titleZh,
  description,
  descriptionZh,
  ctaText,
  ctaTextZh,
}: HeroProps) {
  const { t, localized } = useLocale();

  return (
    <section className="relative h-[100svh] w-full overflow-hidden">
      <Image
        src={imageSrc}
        alt={t("hero.alt")}
        fill
        priority
        quality={90}
        className="object-cover"
        sizes="100vw"
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm tracking-[0.4em] uppercase text-white/70">
          {localized(subtitle, subtitleZh) || t("hero.subtitle")}
        </p>
        <h1 className="text-5xl md:text-7xl font-extralight tracking-wider text-white">
          {localized(title, titleZh) || t("hero.title")}
        </h1>
        <p className="mt-6 max-w-lg text-lg font-light text-white/80 leading-relaxed">
          {localized(description, descriptionZh) || t("hero.description")}
        </p>
        <Link
          href="/gallery"
          className="mt-10 inline-flex items-center gap-2 border border-white/40 px-8 py-3 text-sm tracking-widest uppercase text-white transition-all hover:bg-white hover:text-black"
        >
          {localized(ctaText, ctaTextZh) || t("hero.cta")}
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
