import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, collections, collectionPhotos } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  const numericIds = ids.map(Number);

  await db.delete(collectionPhotos).where(inArray(collectionPhotos.photoId, numericIds));

  for (const id of numericIds) {
    await db.update(collections).set({ coverPhotoId: null }).where(eq(collections.coverPhotoId, id));
  }

  const result = await db.delete(photos).where(inArray(photos.id, numericIds)).returning();

  return NextResponse.json({ deleted: result.length });
}

export async function PATCH(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ids, changes } = await request.json();
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "ids required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (changes.categorySlug !== undefined) updates.categorySlug = changes.categorySlug;
  if (changes.featured !== undefined) updates.featured = changes.featured;
  if (changes.titleZh !== undefined) updates.titleZh = changes.titleZh;
  if (changes.descriptionZh !== undefined) updates.descriptionZh = changes.descriptionZh;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No changes" }, { status: 400 });
  }

  let updated = 0;
  for (const id of ids) {
    const res = await db.update(photos).set(updates).where(eq(photos.id, Number(id))).returning();
    if (res.length > 0) updated++;
  }

  return NextResponse.json({ updated });
}
