import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  siteSettings,
  categories,
  cameras,
  lenses,
  photos,
  collections,
  collectionPhotos,
  socialLinks,
} from "@/lib/db/schema";
import { verifyTokenFromRequest } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();

    if (!data.version || !data.exportedAt) {
      return NextResponse.json({ error: "Invalid backup format" }, { status: 400 });
    }

    const counts: Record<string, number> = {};

    // Delete in reverse FK order
    await db.delete(collectionPhotos);
    await db.delete(collections);
    await db.delete(photos);
    await db.delete(lenses);
    await db.delete(cameras);
    await db.delete(socialLinks);
    await db.delete(categories);
    await db.delete(siteSettings);

    // Insert in FK order
    if (data.siteSettings?.length) {
      for (const row of data.siteSettings) {
        await db.insert(siteSettings).values({ key: row.key, value: row.value });
      }
      counts.siteSettings = data.siteSettings.length;
    }

    if (data.categories?.length) {
      for (const row of data.categories) {
        await db.run(
          sql`INSERT INTO categories (id, name, slug) VALUES (${row.id}, ${row.name}, ${row.slug})`,
        );
      }
      counts.categories = data.categories.length;
    }

    if (data.cameras?.length) {
      for (const row of data.cameras) {
        await db.run(
          sql`INSERT INTO cameras (id, brand, model) VALUES (${row.id}, ${row.brand}, ${row.model})`,
        );
      }
      counts.cameras = data.cameras.length;
    }

    if (data.lenses?.length) {
      for (const row of data.lenses) {
        await db.run(
          sql`INSERT INTO lenses (id, brand, model) VALUES (${row.id}, ${row.brand}, ${row.model})`,
        );
      }
      counts.lenses = data.lenses.length;
    }

    if (data.photos?.length) {
      for (const row of data.photos) {
        await db.insert(photos).values({
          id: row.id,
          src: row.src,
          thumbnail: row.thumbnail || null,
          title: row.title,
          description: row.description || null,
          categorySlug: row.categorySlug || row.category_slug,
          width: row.width,
          height: row.height,
          featured: row.featured || false,
          sortOrder: row.sortOrder ?? row.sort_order ?? 0,
          createdAt: row.createdAt || row.created_at || null,
          cameraId: row.cameraId ?? row.camera_id ?? null,
          lensId: row.lensId ?? row.lens_id ?? null,
          camera: row.camera || null,
          lens: row.lens || null,
          aperture: row.aperture || null,
          shutterSpeed: row.shutterSpeed || row.shutter_speed || null,
          iso: row.iso || null,
          focalLength: row.focalLength || row.focal_length || null,
          takenAt: row.takenAt || row.taken_at || null,
          location: row.location || null,
        });
      }
      counts.photos = data.photos.length;
    }

    if (data.collections?.length) {
      for (const row of data.collections) {
        await db.insert(collections).values({
          id: row.id,
          title: row.title,
          slug: row.slug,
          description: row.description || null,
          coverPhotoId: row.coverPhotoId ?? row.cover_photo_id ?? null,
          sortOrder: row.sortOrder ?? row.sort_order ?? 0,
          createdAt: row.createdAt || row.created_at || null,
        });
      }
      counts.collections = data.collections.length;
    }

    if (data.collectionPhotos?.length) {
      for (const row of data.collectionPhotos) {
        await db.insert(collectionPhotos).values({
          id: row.id,
          collectionId: row.collectionId ?? row.collection_id,
          photoId: row.photoId ?? row.photo_id,
          sortOrder: row.sortOrder ?? row.sort_order ?? 0,
        });
      }
      counts.collectionPhotos = data.collectionPhotos.length;
    }

    if (data.socialLinks?.length) {
      for (const row of data.socialLinks) {
        await db.insert(socialLinks).values({
          id: row.id,
          platform: row.platform,
          label: row.label,
          url: row.url,
          sortOrder: row.sortOrder ?? row.sort_order ?? 0,
        });
      }
      counts.socialLinks = data.socialLinks.length;
    }

    return NextResponse.json({ ok: true, counts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Import failed" },
      { status: 500 },
    );
  }
}
