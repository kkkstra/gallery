import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { lenses } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(lenses).where(eq(lenses.id, Number(id)));
  return NextResponse.json({ ok: true });
}
