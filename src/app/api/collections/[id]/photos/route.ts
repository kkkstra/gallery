import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collectionPhotos, photos, cameras, lenses } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const rows = await db
    .select({
      cpId: collectionPhotos.id,
      cpSortOrder: collectionPhotos.sortOrder,
      id: photos.id,
      src: photos.src,
      thumbnail: photos.thumbnail,
      title: photos.title,
      description: photos.description,
      categorySlug: photos.categorySlug,
      width: photos.width,
      height: photos.height,
      featured: photos.featured,
      cameraId: photos.cameraId,
      lensId: photos.lensId,
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
    .from(collectionPhotos)
    .innerJoin(photos, eq(collectionPhotos.photoId, photos.id))
    .leftJoin(cameras, eq(photos.cameraId, cameras.id))
    .leftJoin(lenses, eq(photos.lensId, lenses.id))
    .where(eq(collectionPhotos.collectionId, Number(id)))
    .orderBy(collectionPhotos.sortOrder);

  const results = rows.map((r) => ({
    ...r,
    cameraName: r.cameraBrand && r.cameraModel ? `${r.cameraBrand} ${r.cameraModel}` : null,
    lensName: r.lensBrand && r.lensModel ? `${r.lensBrand} ${r.lensModel}` : null,
  }));

  return NextResponse.json(results);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body: { photoIds: number[] } = await request.json();

  const existing = await db
    .select()
    .from(collectionPhotos)
    .where(eq(collectionPhotos.collectionId, Number(id)));

  let maxSort = existing.reduce(
    (max, cp) => Math.max(max, cp.sortOrder ?? 0),
    -1,
  );

  for (const photoId of body.photoIds) {
    const alreadyIn = existing.some((cp) => cp.photoId === photoId);
    if (!alreadyIn) {
      maxSort++;
      await db.insert(collectionPhotos).values({
        collectionId: Number(id),
        photoId,
        sortOrder: maxSort,
      });
    }
  }

  return NextResponse.json({ ok: true });
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
  const { searchParams } = new URL(request.url);
  const photoId = searchParams.get("photoId");

  if (photoId) {
    await db
      .delete(collectionPhotos)
      .where(
        and(
          eq(collectionPhotos.collectionId, Number(id)),
          eq(collectionPhotos.photoId, Number(photoId)),
        ),
      );
  }

  return NextResponse.json({ ok: true });
}
