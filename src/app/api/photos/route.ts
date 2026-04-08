import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const featured = searchParams.get("featured");
  const category = searchParams.get("category");

  let results;

  if (featured === "true") {
    results = await db
      .select()
      .from(photos)
      .where(eq(photos.featured, true))
      .orderBy(photos.sortOrder);
  } else if (category) {
    results = await db
      .select()
      .from(photos)
      .where(eq(photos.categorySlug, category))
      .orderBy(photos.sortOrder);
  } else {
    results = await db
      .select()
      .from(photos)
      .orderBy(photos.sortOrder);
  }

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
    })
    .returning();

  return NextResponse.json(result[0], { status: 201 });
}
