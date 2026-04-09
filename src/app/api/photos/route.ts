import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, cameras, lenses } from "@/lib/db/schema";
import { eq, like, or, and, desc, asc, sql } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const camera = searchParams.get("camera");
  const lens = searchParams.get("lens");
  const location = searchParams.get("location");
  const sort = searchParams.get("sort");
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");

  const conditions = [];

  if (featured === "true") {
    conditions.push(eq(photos.featured, true));
  }
  if (category) {
    conditions.push(eq(photos.categorySlug, category));
  }
  if (camera) {
    conditions.push(
      or(
        eq(photos.camera, camera),
        sql`(${cameras.brand} || ' ' || ${cameras.model}) = ${camera}`,
      ),
    );
  }
  if (lens) {
    conditions.push(
      or(
        eq(photos.lens, lens),
        sql`(${lenses.brand} || ' ' || ${lenses.model}) = ${lens}`,
      ),
    );
  }
  if (location) {
    conditions.push(eq(photos.location, location));
  }
  if (q) {
    conditions.push(
      or(
        like(photos.title, `%${q}%`),
        like(photos.description, `%${q}%`),
        like(photos.location, `%${q}%`),
        like(photos.camera, `%${q}%`),
        like(photos.lens, `%${q}%`),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const orderBy = (() => {
    switch (sort) {
      case "taken-asc": return asc(photos.takenAt);
      case "added-desc": return desc(photos.createdAt);
      case "added-asc": return asc(photos.createdAt);
      case "title-asc": return asc(photos.title);
      case "title-desc": return desc(photos.title);
      case "taken-desc": return desc(photos.takenAt);
      default: return photos.sortOrder;
    }
  })();

  const baseQuery = db
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
    .where(where)
    .orderBy(orderBy);

  if (limitParam) {
    const limit = Math.min(100, Math.max(1, Number(limitParam) || 20));
    const offset = Math.max(0, Number(offsetParam) || 0);

    const [rows, countResult] = await Promise.all([
      baseQuery.limit(limit).offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(photos)
        .leftJoin(cameras, eq(photos.cameraId, cameras.id))
        .leftJoin(lenses, eq(photos.lensId, lenses.id))
        .where(where),
    ]);

    const results = rows.map((r) => ({
      ...r,
      cameraName: r.camera || (r.cameraBrand && r.cameraModel ? `${r.cameraBrand} ${r.cameraModel}` : null),
      lensName: r.lens || (r.lensBrand && r.lensModel ? `${r.lensBrand} ${r.lensModel}` : null),
    }));

    return NextResponse.json({
      photos: results,
      total: countResult[0].count,
    });
  }

  const rows = await baseQuery;
  const results = rows.map((r) => ({
    ...r,
    cameraName: r.camera || (r.cameraBrand && r.cameraModel ? `${r.cameraBrand} ${r.cameraModel}` : null),
    lensName: r.lens || (r.lensBrand && r.lensModel ? `${r.lensBrand} ${r.lensModel}` : null),
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
      camera: body.camera || null,
      lens: body.lens || null,
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
