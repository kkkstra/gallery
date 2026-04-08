import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const results = await db
    .select()
    .from(photos)
    .where(eq(photos.id, Number(id)));

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

  const result = await db
    .update(photos)
    .set({
      src: body.src,
      thumbnail: body.thumbnail || null,
      title: body.title,
      description: body.description || null,
      categorySlug: body.categorySlug,
      width: body.width,
      height: body.height,
      featured: body.featured ?? false,
      sortOrder: body.sortOrder ?? 0,
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
  const result = await db
    .delete(photos)
    .where(eq(photos.id, Number(id)))
    .returning();

  if (result.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
