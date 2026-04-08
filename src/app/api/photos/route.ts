import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, cameras, lenses } from "@/lib/db/schema";
import { eq, like, or, and, sql } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");
  const q = searchParams.get("q");

  const conditions = [];

  if (featured === "true") {
    conditions.push(eq(photos.featured, true));
  }
  if (category) {
    conditions.push(eq(photos.categorySlug, category));
  }
  if (q) {
    conditions.push(
      or(
        like(photos.title, `%${q}%`),
        like(photos.description, `%${q}%`),
      ),
    );
  }

  const rows = await db
    .select({
      id: photos.id,
      src: photos.src,
      thumbnail: photos.thumbnail,
      title: photos.title,
      description: photos.description,
      categorySlug: photos.categorySlug,
      width: photos.width,
      height: photos.height,
      featured: photos.featured,
      sortOrder: photos.sortOrder,
      createdAt: photos.createdAt,
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
    .from(photos)
    .leftJoin(cameras, eq(photos.cameraId, cameras.id))
    .leftJoin(lenses, eq(photos.lensId, lenses.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(photos.sortOrder);

  const results = rows.map((r) => ({
    ...r,
    cameraName: r.cameraBrand && r.cameraModel ? `${r.cameraBrand} ${r.cameraModel}` : null,
    lensName: r.lensBrand && r.lensModel ? `${r.lensBrand} ${r.lensModel}` : null,
  }));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = await db
    .insert(photos)
    .values({
      src: body.src,
      thumbnail: body.thumbnail || null,
      title: body.title,
      description: body.description || null,
      categorySlug: body.categorySlug,
      width: body.width,
      height: body.height,
      featured: body.featured || false,
      sortOrder: body.sortOrder || 0,
      cameraId: body.cameraId || null,
      lensId: body.lensId || null,
      aperture: body.aperture || null,
      shutterSpeed: body.shutterSpeed || null,
      iso: body.iso || null,
      focalLength: body.focalLength || null,
      takenAt: body.takenAt || null,
      location: body.location || null,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
