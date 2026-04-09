"use client";

import { useLocale } from "./LocaleProvider";

interface Category {
  slug: string;
  name: string;
  nameZh?: string;
}

interface CategoryFilterProps {
  categories: Category[];
  active: string | null;
  onChange: (category: string | null) => void;
}

export default function CategoryFilter({
  categories,
  active,
  onChange,
}: CategoryFilterProps) {
  const { t, localized } = useLocale();

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-2 text-xs tracking-widest uppercase transition-all border ${
          active === null
            ? "border-[var(--text)] text-[var(--text)]"
            : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]"
        }`}
      >
        {t("category.all")}
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onChange(cat.slug)}
          className={`px-4 py-2 text-xs tracking-widest uppercase transition-all border ${
            active === cat.slug
              ? "border-[var(--text)] text-[var(--text)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {localized(cat.name, cat.nameZh)}
        </button>
      ))}
    </div>
  );
}
