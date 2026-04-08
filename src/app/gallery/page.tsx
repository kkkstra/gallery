"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { Photo } from "@/lib/types";
import PhotoGrid from "@/components/PhotoGrid";
import Lightbox from "@/components/Lightbox";
import CategoryFilter from "@/components/CategoryFilter";

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/photos").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([photosData, catsData]) => {
      setPhotos(
        photosData.map((p: Record<string, unknown>) => ({
          id: String(p.id),
          src: p.src as string,
          thumbnail: p.thumbnail as string | undefined,
          title: p.title as string,
          description: p.description as string | undefined,
          category: p.categorySlug as string,
          width: p.width as number,
          height: p.height as number,
          featured: !!p.featured,
          camera: p.cameraName as string | undefined,
          lens: p.lensName as string | undefined,
          aperture: p.aperture as string | undefined,
          shutterSpeed: p.shutterSpeed as string | undefined,
          iso: p.iso as string | undefined,
          focalLength: p.focalLength as string | undefined,
          takenAt: p.takenAt as string | undefined,
          location: p.location as string | undefined,
        })),
      );
      setCategories(catsData.map((c: { slug: string }) => c.slug));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let result = photos;
    if (activeCategory) {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [activeCategory, searchQuery, photos]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-center py-20">
          <p className="text-[var(--text-faint)]">Loading gallery...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-[var(--text-faint)]">
          Browse Collection
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-extralight tracking-wide">
          Gallery
        </h1>
      </div>

      <div className="mb-8">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      </div>

      {/* Search */}
      <div className="mb-8 max-w-md mx-auto">
        <div className="relative">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-faint)]"
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
            placeholder="Search photos..."
            className="w-full rounded-full border border-[var(--border)] bg-[var(--surface)] pl-11 pr-4 py-2.5 text-sm text-[var(--text)] placeholder-[var(--text-faint)] outline-none focus:border-[var(--text-muted)] transition-colors"
          />
        </div>
        {searchQuery.trim() && (
          <p className="mt-3 text-center text-sm text-[var(--text-faint)]">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}&rdquo;
          </p>
        )}
      </div>

      <PhotoGrid photos={filtered} onPhotoClick={setLightboxIndex} />

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={filtered}
            currentIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
