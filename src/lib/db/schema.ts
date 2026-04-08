import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
});

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
});

export const socialLinks = sqliteTable("social_links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  platform: text("platform").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const cameras = sqliteTable("cameras", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
});

export const lenses = sqliteTable("lenses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
});

export const photos = sqliteTable("photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  src: text("src").notNull(),
  thumbnail: text("thumbnail"),
  title: text("title").notNull(),
  description: text("description"),
  categorySlug: text("category_slug")
    .notNull()
    .references(() => categories.slug),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  featured: integer("featured", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  cameraId: integer("camera_id").references(() => cameras.id),
  lensId: integer("lens_id").references(() => lenses.id),
  camera: text("camera"),
  lens: text("lens"),
  aperture: text("aperture"),
  shutterSpeed: text("shutter_speed"),
  iso: text("iso"),
  focalLength: text("focal_length"),
  takenAt: text("taken_at"),
  location: text("location"),
});

export const collections = sqliteTable("collections", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverPhotoId: integer("cover_photo_id").references(() => photos.id),
  sortOrder: integer("sort_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const collectionPhotos = sqliteTable("collection_photos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  collectionId: integer("collection_id")
    .notNull()
    .references(() => collections.id),
  photoId: integer("photo_id")
    .notNull()
    .references(() => photos.id),
  sortOrder: integer("sort_order").default(0),
});
