"use client";

import { useEffect, useState } from "react";
import { useLocale } from "./LocaleProvider";

interface SocialLink {
  id: number;
  platform: string;
  label: string;
  url: string;
  sortOrder: number;
}

export default function Footer() {
  const { t, localized } = useLocale();
  const [links, setLinks] = useState<SocialLink[]>([]);
  const [copyright, setCopyright] = useState("");
  const [copyrightZh, setCopyrightZh] = useState("");

  useEffect(() => {
    fetch("/api/social-links")
      .then((r) => r.json())
      .then(setLinks)
      .catch(() => {});
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.footer_copyright) setCopyright(data.footer_copyright);
        if (data.footer_copyright_zh) setCopyrightZh(data.footer_copyright_zh);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-[var(--text-faint)] text-sm">
        {links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-6">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target={link.platform === "email" ? undefined : "_blank"}
                rel={link.platform === "email" ? undefined : "noopener noreferrer"}
                className="hover:text-[var(--text)] transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
        <p className="tracking-wide">
          &copy; {new Date().getFullYear()} {localized(copyright, copyrightZh) || t("footer.copyright")}
        </p>
      </div>
    </footer>
  );
}
