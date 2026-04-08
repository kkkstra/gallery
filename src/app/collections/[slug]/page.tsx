"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { AnimatePresence } from "framer-motion";
import { marked } from "marked";
import { Photo } from "@/lib/types";
import PhotoGrid from "@/components/PhotoGrid";
import Lightbox from "@/components/Lightbox";

interface CollectionData {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  coverPhotoId: number | null;
}

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<CollectionData | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [coverSrc, setCoverSrc] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/collections")
      .then((r) => r.json())
      .then((cols) => {
        const col = cols.find((c: { slug: string }) => c.slug === slug);
        if (!col) {
          setLoading(false);
          return;
        }
        setCollection(col);
        setCoverSrc(col.coverSrc || null);

        fetch(`/api/collections/${col.id}/photos`)
          .then((r) => r.json())
          .then((photosData) => {
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
            setLoading(false);
          });
      });
  }, [slug]);

  if (loading) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-500">Loading...</p>
        </div>
      </section>
    );
  }

  if (!collection) {
    return (
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center py-20">
          <p className="text-neutral-500">Collection not found.</p>
        </div>
      </section>
    );
  }

  const descriptionHtml = collection.description
    ? (marked.parse(collection.description, { async: false }) as string)
    : null;

  return (
    <>
      {/* Hero header */}
      <section className="relative h-[50vh] min-h-[320px] w-full overflow-hidden">
        {coverSrc ? (
          <Image
            src={coverSrc}
            alt={collection.title}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="h-full bg-neutral-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/40 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-10">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm tracking-[0.3em] uppercase text-white/60 mb-2">Collection</p>
            <h1 className="text-4xl md:text-5xl font-extralight tracking-wider text-white">
              {collection.title}
            </h1>
            <p className="mt-2 text-sm text-white/50">{photos.length} photos</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {descriptionHtml && (
          <div
            className="prose-dark max-w-2xl mb-12"
            dangerouslySetInnerHTML={{ __html: descriptionHtml }}
          />
        )}

        <PhotoGrid photos={photos} onPhotoClick={setLightboxIndex} />

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
    </>
  );
}
