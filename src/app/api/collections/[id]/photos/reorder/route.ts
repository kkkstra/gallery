import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collectionPhotos } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const collectionId = Number(id);
  const { photoIds } = await request.json();
  if (!Array.isArray(photoIds)) {
    return NextResponse.json({ error: "photoIds must be an array" }, { status: 400 });
  }

  for (let i = 0; i < photoIds.length; i++) {
    await db
      .update(collectionPhotos)
      .set({ sortOrder: i })
      .where(
        and(
          eq(collectionPhotos.collectionId, collectionId),
          eq(collectionPhotos.photoId, Number(photoIds[i])),
        ),
      );
  }

  return NextResponse.json({ ok: true });
}
