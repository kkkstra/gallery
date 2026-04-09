"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Photo } from "@/lib/types";
import PhotoGrid, { type LayoutMode } from "@/components/PhotoGrid";
import Lightbox from "@/components/Lightbox";
import CategoryFilter from "@/components/CategoryFilter";
import { useLocale } from "@/components/LocaleProvider";
import type { TransKey } from "@/lib/i18n";

type SortKey =
  | "taken-desc"
  | "taken-asc"
  | "added-desc"
  | "added-asc"
  | "title-asc"
  | "title-desc";

const SORT_OPTIONS: { value: SortKey; labelKey: TransKey }[] = [
  { value: "taken-desc", labelKey: "sort.takenDesc" },
  { value: "taken-asc", labelKey: "sort.takenAsc" },
  { value: "added-desc", labelKey: "sort.addedDesc" },
  { value: "added-asc", labelKey: "sort.addedAsc" },
  { value: "title-asc", labelKey: "sort.titleAsc" },
  { value: "title-desc", labelKey: "sort.titleDesc" },
];

const PAGE_SIZE = 20;

function mapPhoto(p: Record<string, unknown>): Photo {
  return {
    id: String(p.id),
    src: p.src as string,
    thumbnail: p.thumbnail as string | undefined,
    title: p.title as string,
    titleZh: p.titleZh as string | undefined,
    description: p.description as string | undefined,
    descriptionZh: p.descriptionZh as string | undefined,
    category: p.categorySlug as string,
    width: p.width as number,
    height: p.height as number,
    featured: !!p.featured,
    camera: (p.cameraName || p.camera) as string | undefined,
    lens: (p.lensName || p.lens) as string | undefined,
    aperture: p.aperture as string | undefined,
    shutterSpeed: p.shutterSpeed as string | undefined,
    iso: p.iso as string | undefined,
    focalLength: p.focalLength as string | undefined,
    takenAt: p.takenAt as string | undefined,
    location: p.location as string | undefined,
    createdAt: p.createdAt as string | undefined,
    sortOrder: p.sortOrder as number | undefined,
  };
}

function LayoutBtn({ active, onClick, label, children }: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`px-2.5 py-2 transition-colors ${
        active
          ? "bg-[var(--text)] text-[var(--bg)]"
          : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]"
      }`}
    >
      {children}
    </button>
  );
}

export default function GalleryPage() {
  const { t, photoCount } = useLocale();

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<{ slug: string; name: string; nameZh?: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("taken-desc");
  const [cameraFilter, setCameraFilter] = useState<string | null>(null);
  const [lensFilter, setLensFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("gallery_layout") as LayoutMode) || "grid";
    }
    return "grid";
  });
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [uniqueCameras, setUniqueCameras] = useState<string[]>([]);
  const [uniqueLenses, setUniqueLenses] = useState<string[]>([]);
  const [uniqueLocations, setUniqueLocations] = useState<string[]>([]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const hasMore = photos.length < total;

  useEffect(() => {
    Promise.all([
      fetch("/api/photos/filters").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([filters, catsData]) => {
      setUniqueCameras(filters.cameras || []);
      setUniqueLenses(filters.lenses || []);
      setUniqueLocations(filters.locations || []);
      setCategories(catsData.map((c: { slug: string; name: string; nameZh?: string }) => ({
        slug: c.slug,
        name: c.name,
        nameZh: c.nameZh,
      })));
    });
  }, []);

  const buildUrl = useCallback(
    (offset: number) => {
      const params = new URLSearchParams();
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      params.set("sort", sortKey);
      if (activeCategory) params.set("category", activeCategory);
      if (cameraFilter) params.set("camera", cameraFilter);
      if (lensFilter) params.set("lens", lensFilter);
      if (locationFilter) params.set("location", locationFilter);
      if (searchQuery.trim()) params.set("q", searchQuery.trim());
      return `/api/photos?${params.toString()}`;
    },
    [sortKey, activeCategory, cameraFilter, lensFilter, locationFilter, searchQuery],
  );

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const res = await fetch(buildUrl(offset));
        const data = await res.json();
        const mapped = data.photos.map(mapPhoto);
        setPhotos((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotal(data.total);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [buildUrl],
  );

  useEffect(() => {
    setPhotos([]);
    setTotal(0);
    fetchPage(0, false);
  }, [sortKey, activeCategory, cameraFilter, lensFilter, locationFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setPhotos([]);
      setTotal(0);
      fetchPage(0, false);
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPage(photos.length, true);
        }
      },
      { rootMargin: "400px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, photos.length, fetchPage]);

  const activeFilterCount = [cameraFilter, lensFilter, locationFilter].filter(Boolean).length;

  const clearAllFilters = () => {
    setActiveCategory(null);
    setCameraFilter(null);
    setLensFilter(null);
    setLocationFilter(null);
    setSearchQuery("");
    setSortKey("taken-desc");
  };

  const selectClass =
    "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)] outline-none focus:border-[var(--text-muted)] transition-colors appearance-none cursor-pointer";

  if (loading && photos.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-center py-20">
          <p className="text-[var(--text-faint)]">{t("gallery.loading")}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-[var(--text-faint)]">
          {t("gallery.browseCollection")}
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-extralight tracking-wide">
          {t("gallery.title")}
        </h1>
      </div>

      <div className="mb-8">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-3">
        <div className="relative w-full sm:w-auto sm:min-w-[280px]">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-faint)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("gallery.searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-10 pr-4 py-2 text-sm text-[var(--text)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--text-muted)] transition-colors"
          />
        </div>

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className={selectClass}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey)}
            </option>
          ))}
        </select>

        {(uniqueCameras.length > 0 || uniqueLenses.length > 0 || uniqueLocations.length > 0) && (
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-[var(--text)] text-[var(--text)]"
                : "border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]"
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
            </svg>
            {t("gallery.filters")}
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center h-5 w-5 rounded-full bg-[var(--text)] text-[var(--bg)] text-[10px] font-medium">
                {activeFilterCount}
              </span>
            )}
          </button>
        )}

        {/* Layout toggle */}
        <div className="flex items-center rounded-lg border border-[var(--border)] overflow-hidden">
          <LayoutBtn
            active={layoutMode === "grid"}
            onClick={() => { setLayoutMode("grid"); localStorage.setItem("gallery_layout", "grid"); }}
            label={t("layout.grid")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
          </LayoutBtn>
          <LayoutBtn
            active={layoutMode === "square"}
            onClick={() => { setLayoutMode("square"); localStorage.setItem("gallery_layout", "square"); }}
            label={t("layout.square")}
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="0.5" /><rect x="9" y="1" width="6" height="6" rx="0.5" /><rect x="1" y="9" width="6" height="6" rx="0.5" /><rect x="9" y="9" width="6" height="6" rx="0.5" />
            </svg>
          </LayoutBtn>
          <LayoutBtn
            active={layoutMode === "feed"}
            onClick={() => { setLayoutMode("feed"); localStorage.setItem("gallery_layout", "feed"); }}
            label={t("layout.feed")}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </LayoutBtn>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4 max-w-2xl mx-auto">
          <div className="flex flex-wrap items-end gap-4">
            {uniqueCameras.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--text-faint)] tracking-wider uppercase">{t("filter.camera")}</label>
                <select
                  value={cameraFilter || ""}
                  onChange={(e) => setCameraFilter(e.target.value || null)}
                  className={selectClass}
                >
                  <option value="">{t("filter.allCameras")}</option>
                  {uniqueCameras.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            {uniqueLenses.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--text-faint)] tracking-wider uppercase">{t("filter.lens")}</label>
                <select
                  value={lensFilter || ""}
                  onChange={(e) => setLensFilter(e.target.value || null)}
                  className={selectClass}
                >
                  <option value="">{t("filter.allLenses")}</option>
                  {uniqueLenses.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>
            )}
            {uniqueLocations.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-[var(--text-faint)] tracking-wider uppercase">{t("filter.location")}</label>
                <select
                  value={locationFilter || ""}
                  onChange={(e) => setLocationFilter(e.target.value || null)}
                  className={selectClass}
                >
                  <option value="">{t("filter.allLocations")}</option>
                  {uniqueLocations.map((loc) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            )}
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={() => { setCameraFilter(null); setLensFilter(null); setLocationFilter(null); }}
                className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] transition-colors underline underline-offset-2 pb-2.5"
              >
                {t("gallery.clearFilters")}
              </button>
            )}
          </div>
        </div>
      )}

      {(searchQuery.trim() || activeCategory || activeFilterCount > 0) && (
        <div className="mb-6 flex items-center justify-center gap-3">
          <p className="text-sm text-[var(--text-faint)]">
            {photoCount(total)}
            {searchQuery.trim() && <> {t("gallery.matching")} &ldquo;{searchQuery}&rdquo;</>}
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs text-[var(--text-faint)] hover:text-[var(--text)] transition-colors underline underline-offset-2"
          >
            {t("gallery.clearAll")}
          </button>
        </div>
      )}

      <PhotoGrid photos={photos} layout={layoutMode} onPhotoClick={setLightboxIndex} />

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--text-faint)] border-t-transparent" />
        </div>
      )}

      {!hasMore && photos.length > 0 && !loading && (
        <p className="text-center text-sm text-[var(--text-faint)] py-8">
          {t("gallery.allLoaded", { n: total })}
        </p>
      )}

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={photos}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
