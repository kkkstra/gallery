"use client";

import { useLocale } from "./LocaleProvider";
import type { TransKey } from "@/lib/i18n";

export function T({ k, vars }: { k: TransKey; vars?: Record<string, string | number> }) {
  const { t } = useLocale();
  return <>{t(k, vars)}</>;
}

export function PhotoCountText({ n }: { n: number }) {
  const { photoCount } = useLocale();
  return <>{photoCount(n)}</>;
}

export function L({ en, zh }: { en?: string | null; zh?: string | null }) {
  const { localized } = useLocale();
  return <>{localized(en, zh)}</>;
}
