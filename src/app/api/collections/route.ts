import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections, collectionPhotos, photos } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db
    .select({
      id: collections.id,
      title: collections.title,
      slug: collections.slug,
      description: collections.description,
      coverPhotoId: collections.coverPhotoId,
      sortOrder: collections.sortOrder,
      createdAt: collections.createdAt,
      coverSrc: photos.thumbnail,
      coverSrcFull: photos.src,
      photoCount: sql<number>`(SELECT COUNT(*) FROM collection_photos WHERE collection_id = ${collections.id})`,
    })
    .from(collections)
    .leftJoin(photos, eq(collections.coverPhotoId, photos.id))
    .orderBy(collections.sortOrder);

  const results = rows.map((r) => ({
    ...r,
    coverSrc: r.coverSrc || r.coverSrcFull || null,
  }));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const slug =
    body.slug ||
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const result = await db
    .insert(collections)
    .values({
      title: body.title,
      slug,
      description: body.description || null,
      coverPhotoId: body.coverPhotoId || null,
      sortOrder: body.sortOrder || 0,
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
