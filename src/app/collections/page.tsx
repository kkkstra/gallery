import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { collections, collectionPhotos, photos } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { T, L, PhotoCountText } from "@/components/T";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
      titleZh: collections.titleZh,
      slug: collections.slug,
      coverPhotoId: collections.coverPhotoId,
      coverSrc: photos.src,
      coverThumbnail: photos.thumbnail,
      photoCount: sql<number>`(SELECT COUNT(*) FROM collection_photos WHERE collection_id = ${collections.id})`,
    })
    .from(collections)
    .leftJoin(photos, eq(collections.coverPhotoId, photos.id))
    .orderBy(collections.sortOrder);

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <p className="text-sm tracking-[0.3em] uppercase text-[var(--text-faint)]">
          <T k="collections.curatedSets" />
        </p>
        <h1 className="mt-3 text-3xl md:text-4xl font-extralight tracking-wide text-[var(--text)]">
          <T k="collections.title" />
        </h1>
      </div>

      {rows.length === 0 ? (
        <p className="text-center text-[var(--text-faint)]"><T k="collections.empty" /></p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((col) => {
            const cover = col.coverSrc || col.coverThumbnail;
            return (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="group block overflow-hidden"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={col.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-[var(--surface)] text-[var(--text-faint)]">
                      <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18.75h19.5M2.25 5.25a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v13.5" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/30" />
                </div>
                <div className="mt-3">
                  <h2 className="text-lg font-light tracking-wider text-[var(--text)] group-hover:opacity-80 transition-opacity">
                    <L en={col.title} zh={col.titleZh} />
                  </h2>
                  <p className="text-xs text-[var(--text-faint)] mt-1">
                    <PhotoCountText n={col.photoCount} />
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
