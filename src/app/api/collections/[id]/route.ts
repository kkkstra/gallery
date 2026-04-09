import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections, collectionPhotos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const results = await db
    .select()
    .from(collections)
    .where(eq(collections.id, Number(id)));

  if (results.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(results[0]);
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

  const slug =
    body.slug ||
    body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const result = await db
    .update(collections)
    .set({
      title: body.title,
      titleZh: body.titleZh || null,
      slug,
      description: body.description || null,
      descriptionZh: body.descriptionZh || null,
      coverPhotoId: body.coverPhotoId || null,
      sortOrder: body.sortOrder ?? 0,
    })
    .where(eq(collections.id, Number(id)))
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
  await db.delete(collectionPhotos).where(eq(collectionPhotos.collectionId, Number(id)));
  const result = await db
    .delete(collections)
    .where(eq(collections.id, Number(id)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
