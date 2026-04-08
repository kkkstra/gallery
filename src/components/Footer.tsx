"use client";

import { useEffect, useState } from "react";

interface FooterSettings {
  social_instagram: string;
  social_twitter: string;
  social_email: string;
  footer_copyright: string;
}

const defaults: FooterSettings = {
  social_instagram: "https://instagram.com",
  social_twitter: "https://twitter.com",
  social_email: "hello@example.com",
  footer_copyright: "Gallery. All rights reserved.",
};

export default function Footer() {
  const [s, setS] = useState<FooterSettings>(defaults);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        setS({
          social_instagram: data.social_instagram || defaults.social_instagram,
          social_twitter: data.social_twitter || defaults.social_twitter,
          social_email: data.social_email || defaults.social_email,
          footer_copyright: data.footer_copyright || defaults.footer_copyright,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-white/10 bg-black py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-6 text-neutral-500 text-sm">
        <div className="flex gap-6">
          {s.social_instagram && (
            <a
              href={s.social_instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Instagram
            </a>
          )}
          {s.social_twitter && (
            <a
              href={s.social_twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Twitter
            </a>
          )}
          {s.social_email && (
            <a
              href={`mailto:${s.social_email}`}
              className="hover:text-white transition-colors"
            >
              Email
            </a>
          )}
        </div>
        <p className="tracking-wide">
          &copy; {new Date().getFullYear()} {s.footer_copyright}
        </p>
      </div>
    </footer>
  );
}
