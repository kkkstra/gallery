"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { useLocale } from "./LocaleProvider";
import type { TransKey } from "@/lib/i18n";

const navLinks: { href: string; labelKey: TransKey }[] = [
  { href: "/", labelKey: "nav.home" },
  { href: "/gallery", labelKey: "nav.gallery" },
  { href: "/collections", labelKey: "nav.collections" },
  { href: "/about", labelKey: "nav.about" },
];

function ThemeToggle() {
  const { theme, setTheme, resolved } = useTheme();
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const cycle = () => {
    if (theme === "system") setTheme(resolved === "dark" ? "light" : "dark");
    else if (theme === "dark") setTheme("light");
    else setTheme("dark");
  };

  const longPress = () => setTheme("system");

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={cycle}
      onDoubleClick={longPress}
      className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      aria-label={t("nav.toggleTheme")}
      title={t("nav.toggleTheme")}
    >
      {resolved === "dark" ? (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}

function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={() => setLocale(locale === "en" ? "zh" : "en")}
      className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors text-xs font-medium tracking-wide"
      aria-label="Switch language"
    >
      {locale === "en" ? "中" : "EN"}
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { t, localized } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [siteTitle, setSiteTitle] = useState("Gallery");
  const [siteTitleZh, setSiteTitleZh] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.site_title) setSiteTitle(data.site_title);
        if (data.site_title_zh) setSiteTitleZh(data.site_title_zh);
      })
      .catch(() => {});
  }, []);

  if (pathname.startsWith("/admin")) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[var(--header-bg)] backdrop-blur-md border-b border-[var(--border)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="text-xl font-light tracking-[0.3em] uppercase text-[var(--text)]"
        >
          {localized(siteTitle, siteTitleZh)}
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm tracking-widest uppercase transition-colors ${
                    (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))
                      ? "text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
          <LocaleToggle />
          <ThemeToggle />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <LocaleToggle />
          <ThemeToggle />
          <button
            className="flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t("nav.toggleMenu")}
          >
            <span className={`block h-px w-6 bg-[var(--text)] transition-transform ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`} />
            <span className={`block h-px w-6 bg-[var(--text)] transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-px w-6 bg-[var(--text)] transition-transform ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`} />
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md">
          <ul className="flex flex-col items-center gap-6 py-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`text-sm tracking-widest uppercase transition-colors ${
                    (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))
                      ? "text-[var(--text)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(link.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
