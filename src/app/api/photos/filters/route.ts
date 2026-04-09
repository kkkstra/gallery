import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { photos, cameras, lenses } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const [cameraRows, lensRows, locationRows] = await Promise.all([
    db
      .selectDistinct({
        name: sql<string>`COALESCE(${photos.camera}, ${cameras.brand} || ' ' || ${cameras.model})`,
      })
      .from(photos)
      .leftJoin(cameras, eq(photos.cameraId, cameras.id))
      .where(sql`COALESCE(${photos.camera}, ${cameras.brand}) IS NOT NULL`),
    db
      .selectDistinct({
        name: sql<string>`COALESCE(${photos.lens}, ${lenses.brand} || ' ' || ${lenses.model})`,
      })
      .from(photos)
      .leftJoin(lenses, eq(photos.lensId, lenses.id))
      .where(sql`COALESCE(${photos.lens}, ${lenses.brand}) IS NOT NULL`),
    db
      .selectDistinct({ name: photos.location })
      .from(photos)
      .where(sql`${photos.location} IS NOT NULL AND ${photos.location} != ''`),
  ]);

  return NextResponse.json({
    cameras: cameraRows.map((r) => r.name).filter(Boolean),
    lenses: lensRows.map((r) => r.name).filter(Boolean),
    locations: locationRows.map((r) => r.name).filter(Boolean),
  });
}
