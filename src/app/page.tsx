import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import { db } from "@/lib/db";
import { photos as photosTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allPhotos = await db.select().from(photosTable).orderBy(photosTable.sortOrder);
  const featured = await db
    .select()
    .from(photosTable)
    .where(eq(photosTable.featured, true))
    .orderBy(photosTable.sortOrder);

  const heroPhoto = allPhotos[0];
  if (!heroPhoto) {
    return (
      <section className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-500">No photos yet. Add some in the admin panel.</p>
      </section>
    );
  }

  return (
    <>
      <Hero imageSrc={heroPhoto.src} />

      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="mb-16 text-center">
          <p className="text-sm tracking-[0.3em] uppercase text-neutral-500">
            Selected Works
          </p>
          <h2 className="mt-3 text-3xl md:text-4xl font-extralight tracking-wide">
            Featured
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured.map((photo) => (
            <Link
              key={photo.id}
              href="/gallery"
              className="group relative aspect-[3/2] overflow-hidden"
            >
              <Image
                src={photo.thumbnail || photo.src}
                alt={photo.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/40" />
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                <h3 className="text-lg font-light tracking-wider text-white">
                  {photo.title}
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  {photo.categorySlug}
                </p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 border border-white/30 px-8 py-3 text-sm tracking-widest uppercase text-white transition-all hover:bg-white hover:text-black"
          >
            View All Works
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
