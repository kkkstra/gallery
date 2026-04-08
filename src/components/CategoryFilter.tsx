"use client";

interface CategoryFilterProps {
  categories: string[];
  active: string | null;
  onChange: (category: string | null) => void;
}

export default function CategoryFilter({
  categories,
  active,
  onChange,
}: CategoryFilterProps) {
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
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 text-xs tracking-widest uppercase transition-all border ${
            active === cat
              ? "border-[var(--text)] text-[var(--text)]"
              : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
