"use client";

import { marked } from "marked";
import { useLocale } from "@/components/LocaleProvider";

export function AboutContent({ contentEn, contentZh }: { contentEn: string; contentZh: string }) {
  const { localized } = useLocale();
  const content = localized(contentEn, contentZh);
  const html = marked.parse(content, { async: false }) as string;

  return (
    <div
      className="prose-styled"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
