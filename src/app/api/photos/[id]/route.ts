import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, cameras, lenses, collections, collectionPhotos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const rows = await db
    .select({
      id: photos.id,
      src: photos.src,
      thumbnail: photos.thumbnail,
      title: photos.title,
      titleZh: photos.titleZh,
      description: photos.description,
      descriptionZh: photos.descriptionZh,
      categorySlug: photos.categorySlug,
      width: photos.width,
      height: photos.height,
      featured: photos.featured,
      sortOrder: photos.sortOrder,
      createdAt: photos.createdAt,
      cameraId: photos.cameraId,
      lensId: photos.lensId,
      camera: photos.camera,
      lens: photos.lens,
      aperture: photos.aperture,
      shutterSpeed: photos.shutterSpeed,
      iso: photos.iso,
      focalLength: photos.focalLength,
      takenAt: photos.takenAt,
      location: photos.location,
      cameraBrand: cameras.brand,
      cameraModel: cameras.model,
      lensBrand: lenses.brand,
      lensModel: lenses.model,
    })
    .from(photos)
    .leftJoin(cameras, eq(photos.cameraId, cameras.id))
    .leftJoin(lenses, eq(photos.lensId, lenses.id))
    .where(eq(photos.id, Number(id)));

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = rows[0];
  return NextResponse.json({
    ...r,
    cameraName: r.camera || (r.cameraBrand && r.cameraModel ? `${r.cameraBrand} ${r.cameraModel}` : null),
    lensName: r.lens || (r.lensBrand && r.lensModel ? `${r.lensBrand} ${r.lensModel}` : null),
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const result = await db
    .update(photos)
    .set({
      src: body.src,
      thumbnail: body.thumbnail || null,
      title: body.title,
      titleZh: body.titleZh || null,
      description: body.description || null,
      descriptionZh: body.descriptionZh || null,
      categorySlug: body.categorySlug,
      width: body.width,
      height: body.height,
      featured: body.featured ?? false,
      sortOrder: body.sortOrder ?? 0,
      cameraId: body.cameraId || null,
      lensId: body.lensId || null,
      camera: body.camera || null,
      lens: body.lens || null,
      aperture: body.aperture || null,
      shutterSpeed: body.shutterSpeed || null,
      iso: body.iso || null,
      focalLength: body.focalLength || null,
      takenAt: body.takenAt || null,
      location: body.location || null,
    })
    .where(eq(photos.id, Number(id)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result[0]);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const photoId = Number(id);

  await db.delete(collectionPhotos).where(eq(collectionPhotos.photoId, photoId));
  await db
    .update(collections)
    .set({ coverPhotoId: null })
    .where(eq(collections.coverPhotoId, photoId));

  const result = await db
    .delete(photos)
    .where(eq(photos.id, photoId))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
