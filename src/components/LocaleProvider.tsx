"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { type Locale, type TransKey, t as translate, photoCount as pc, localized as loc } from "@/lib/i18n";

interface LocaleCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TransKey, vars?: Record<string, string | number>) => string;
  photoCount: (n: number) => string;
  localized: (en: string | null | undefined, zh: string | null | undefined) => string;
}

const LocaleContext = createContext<LocaleCtx>({
  locale: "en",
  setLocale: () => {},
  t: (key) => key,
  photoCount: (n) => `${n}`,
  localized: (en) => en || "",
});

export function useLocale() {
  return useContext(LocaleContext);
}

export default function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "en" || stored === "zh") {
      setLocaleState(stored);
    } else {
      const browserLang = navigator.language;
      if (browserLang.startsWith("zh")) setLocaleState("zh");
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }, []);

  const t = useCallback(
    (key: TransKey, vars?: Record<string, string | number>) => translate(key, locale, vars),
    [locale],
  );

  const photoCount = useCallback((n: number) => pc(n, locale), [locale]);

  const localized = useCallback(
    (en: string | null | undefined, zh: string | null | undefined) => loc(en, zh, locale),
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, photoCount, localized }}>
      {children}
    </LocaleContext.Provider>
  );
}
