import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { socialLinks } from "@/lib/db/schema";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await db
    .select()
    .from(socialLinks)
    .orderBy(socialLinks.sortOrder);
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: { platform: string; label: string; url: string; sortOrder: number }[] =
    await request.json();

  await db.delete(socialLinks);

  for (const link of body) {
    await db.insert(socialLinks).values({
      platform: link.platform,
      label: link.label,
      url: link.url,
      sortOrder: link.sortOrder,
    });
  }

  const results = await db
    .select()
    .from(socialLinks)
    .orderBy(socialLinks.sortOrder);
  return NextResponse.json(results);
}
