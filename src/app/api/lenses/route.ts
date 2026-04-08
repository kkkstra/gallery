import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lenses } from "@/lib/db/schema";
import { verifyTokenFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const results = await db.select().from(lenses);
  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = await db
    .insert(lenses)
    .values({ brand: body.brand, model: body.model })
    .returning();
  return NextResponse.json(result[0], { status: 201 });
}
