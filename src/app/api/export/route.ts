import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  siteSettings,
  categories,
  cameras,
  lenses,
  photos,
  collections,
  collectionPhotos,
  socialLinks,
} from "@/lib/db/schema";
import { verifyTokenFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const isAuth = await verifyTokenFromRequest(request);
  if (!isAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [
    settingsRows,
    categoriesRows,
    camerasRows,
    lensesRows,
    photosRows,
    collectionsRows,
    collectionPhotosRows,
    socialLinksRows,
  ] = await Promise.all([
    db.select().from(siteSettings),
    db.select().from(categories),
    db.select().from(cameras),
    db.select().from(lenses),
    db.select().from(photos),
    db.select().from(collections),
    db.select().from(collectionPhotos),
    db.select().from(socialLinks),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    siteSettings: settingsRows,
    categories: categoriesRows,
    cameras: camerasRows,
    lenses: lensesRows,
    photos: photosRows,
    collections: collectionsRows,
    collectionPhotos: collectionPhotosRows,
    socialLinks: socialLinksRows,
  };

  return NextResponse.json(payload);
}
