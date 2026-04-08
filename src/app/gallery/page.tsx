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
          src: p.src,
          thumbnail: p.thumbnail,
          title: p.title,
          description: p.description,
          category: p.category_slug,
          width: p.width,
          height: p.height,
          featured: !!p.featured,
        })),
      );
      setCategories(catsData.map((c: { slug: string }) => c.slug));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(
    () =>
      activeCategory
        ? photos.filter((p) => p.category === activeCategory)
        : photos,
    [activeCategory, photos],
  );

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-500">Loading gallery...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-neutral-500">
          Browse Collection
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-extralight tracking-wide">
          Gallery
        </h1>
      </div>

      <div className="mb-12">
        <CategoryFilter
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
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
