import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import fs from "fs";
import path from "path";
import * as schema from "./schema";

const tursoUrl = process.env.TURSO_DATABASE_URL;

if (!tursoUrl) {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

const client = createClient({
  url: tursoUrl || "file:./data/gallery.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

async function seed() {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS social_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT NOT NULL,
      label TEXT NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand TEXT NOT NULL,
      model TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      src TEXT NOT NULL,
      thumbnail TEXT,
      title TEXT NOT NULL,
      description TEXT,
      category_slug TEXT NOT NULL REFERENCES categories(slug),
      width INTEGER NOT NULL,
      height INTEGER NOT NULL,
      featured INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      camera_id INTEGER REFERENCES cameras(id),
      lens_id INTEGER REFERENCES lenses(id),
      camera TEXT,
      lens TEXT,
      aperture TEXT,
      shutter_speed TEXT,
      iso TEXT,
      focal_length TEXT,
      taken_at TEXT,
      location TEXT
    );

    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      cover_photo_id INTEGER REFERENCES photos(id),
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS collection_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL REFERENCES collections(id),
      photo_id INTEGER NOT NULL REFERENCES photos(id),
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Migrate existing photos table: add new columns if missing
  const alterStatements = [
    "ALTER TABLE photos ADD COLUMN camera_id INTEGER REFERENCES cameras(id)",
    "ALTER TABLE photos ADD COLUMN lens_id INTEGER REFERENCES lenses(id)",
    "ALTER TABLE photos ADD COLUMN aperture TEXT",
    "ALTER TABLE photos ADD COLUMN shutter_speed TEXT",
    "ALTER TABLE photos ADD COLUMN iso TEXT",
    "ALTER TABLE photos ADD COLUMN focal_length TEXT",
    "ALTER TABLE photos ADD COLUMN taken_at TEXT",
    "ALTER TABLE photos ADD COLUMN location TEXT",
    "ALTER TABLE photos ADD COLUMN camera TEXT",
    "ALTER TABLE photos ADD COLUMN lens TEXT",
  ];
  for (const stmt of alterStatements) {
    try {
      await client.execute(stmt);
    } catch {
      // Column already exists — ignore
    }
  }

  const seedCategories = [
    { name: "Landscape", slug: "landscape" },
    { name: "Portrait", slug: "portrait" },
    { name: "Street", slug: "street" },
  ];

  const seedPhotos = [
    { src: "https://picsum.photos/id/10/1920/1280", thumbnail: "https://picsum.photos/id/10/600/400", title: "Forest Trail", description: "A winding path through an ancient forest at dawn", categorySlug: "landscape", width: 1920, height: 1280, featured: true, sortOrder: 1 },
    { src: "https://picsum.photos/id/1015/1920/1280", thumbnail: "https://picsum.photos/id/1015/600/400", title: "Mountain River", description: "Crystal clear water flowing through mountain peaks", categorySlug: "landscape", width: 1920, height: 1280, featured: true, sortOrder: 2 },
    { src: "https://picsum.photos/id/1025/1920/1280", thumbnail: "https://picsum.photos/id/1025/600/400", title: "Loyal Companion", description: "A pug resting on warm blankets", categorySlug: "portrait", width: 1920, height: 1280, featured: false, sortOrder: 3 },
    { src: "https://picsum.photos/id/1039/1280/1920", thumbnail: "https://picsum.photos/id/1039/400/600", title: "Misty Peaks", description: "Fog rolling over distant mountain ridges", categorySlug: "landscape", width: 1280, height: 1920, featured: true, sortOrder: 4 },
    { src: "https://picsum.photos/id/1040/1920/1280", thumbnail: "https://picsum.photos/id/1040/600/400", title: "Golden Hour", description: "Warm light bathing the countryside", categorySlug: "landscape", width: 1920, height: 1280, featured: false, sortOrder: 5 },
    { src: "https://picsum.photos/id/1043/1920/1280", thumbnail: "https://picsum.photos/id/1043/600/400", title: "City Lights", description: "Urban skyline glowing at twilight", categorySlug: "street", width: 1920, height: 1280, featured: true, sortOrder: 6 },
    { src: "https://picsum.photos/id/1044/1280/1920", thumbnail: "https://picsum.photos/id/1044/400/600", title: "Quiet Alley", description: "A narrow cobblestone lane in the old town", categorySlug: "street", width: 1280, height: 1920, featured: false, sortOrder: 7 },
    { src: "https://picsum.photos/id/1047/1920/1280", thumbnail: "https://picsum.photos/id/1047/600/400", title: "Ocean Horizon", description: "Endless blue where the sky meets the sea", categorySlug: "landscape", width: 1920, height: 1280, featured: false, sortOrder: 8 },
    { src: "https://picsum.photos/id/1059/1920/1280", thumbnail: "https://picsum.photos/id/1059/600/400", title: "Winter Silence", description: "Snow-covered hills under a pale sky", categorySlug: "landscape", width: 1920, height: 1280, featured: true, sortOrder: 9 },
    { src: "https://picsum.photos/id/1067/1280/1920", thumbnail: "https://picsum.photos/id/1067/400/600", title: "Rain Reflections", description: "Puddles mirroring neon signs on a rainy night", categorySlug: "street", width: 1280, height: 1920, featured: false, sortOrder: 10 },
    { src: "https://picsum.photos/id/1069/1920/1280", thumbnail: "https://picsum.photos/id/1069/600/400", title: "Desert Bloom", description: "Wildflowers emerging from cracked earth", categorySlug: "landscape", width: 1920, height: 1280, featured: false, sortOrder: 11 },
    { src: "https://picsum.photos/id/1080/1920/1280", thumbnail: "https://picsum.photos/id/1080/600/400", title: "Morning Coffee", description: "Steam rising from a ceramic cup by the window", categorySlug: "portrait", width: 1920, height: 1280, featured: true, sortOrder: 12 },
    { src: "https://picsum.photos/id/164/1920/1280", thumbnail: "https://picsum.photos/id/164/600/400", title: "Bridge at Dusk", description: "Steel arches framing a fading sunset", categorySlug: "street", width: 1920, height: 1280, featured: false, sortOrder: 13 },
    { src: "https://picsum.photos/id/167/1280/1920", thumbnail: "https://picsum.photos/id/167/400/600", title: "Lone Tree", description: "A solitary oak standing in an open field", categorySlug: "landscape", width: 1280, height: 1920, featured: false, sortOrder: 14 },
    { src: "https://picsum.photos/id/169/1920/1280", thumbnail: "https://picsum.photos/id/169/600/400", title: "Coastal Rocks", description: "Waves crashing against weathered stone", categorySlug: "landscape", width: 1920, height: 1280, featured: false, sortOrder: 15 },
    { src: "https://picsum.photos/id/180/1280/1920", thumbnail: "https://picsum.photos/id/180/400/600", title: "Urban Geometry", description: "Abstract patterns in modern architecture", categorySlug: "street", width: 1280, height: 1920, featured: false, sortOrder: 16 },
  ];

  const existingCats = await db.select().from(schema.categories);
  if (existingCats.length === 0) {
    console.log("Seeding categories...");
    for (const cat of seedCategories) {
      await db.insert(schema.categories).values(cat);
    }
    console.log(`  Inserted ${seedCategories.length} categories`);
  } else {
    console.log(`Categories already seeded (${existingCats.length} found)`);
  }

  const existingPhotos = await db.select().from(schema.photos);
  if (existingPhotos.length === 0) {
    console.log("Seeding photos...");
    for (const photo of seedPhotos) {
      await db.insert(schema.photos).values(photo);
    }
    console.log(`  Inserted ${seedPhotos.length} photos`);
  } else {
    console.log(`Photos already seeded (${existingPhotos.length} found)`);
  }

  const defaultSettings: Record<string, string> = {
    site_title: "Gallery",
    site_description: "A curated collection of photography — landscapes, portraits, and street scenes.",
    hero_subtitle: "Photography Portfolio",
    hero_title: "Gallery",
    hero_description: "Capturing moments, light, and emotion through the lens.",
    hero_cta_text: "View Gallery",
    about_portrait_url: "https://picsum.photos/id/1005/600/800",
    about_content: `Hello, I'm a photographer based in the heart of the city, drawn to the interplay of light, shadow, and fleeting moments that tell stories words cannot.

With over a decade behind the lens, I specialize in landscape, street, and portrait photography. My work has been featured in various publications and exhibitions around the world.

I believe every photograph is a conversation between the subject and the viewer. My goal is to create images that linger in your memory long after you've looked away.

## Available For

- Commercial Projects
- Editorial Work
- Exhibitions
- Prints & Licensing
- Workshops
- Collaborations`,
    footer_copyright: "Gallery. All rights reserved.",
  };

  const existingSettings = await db.select().from(schema.siteSettings);
  if (existingSettings.length === 0) {
    console.log("Seeding site settings...");
    for (const [key, value] of Object.entries(defaultSettings)) {
      await db.insert(schema.siteSettings).values({ key, value });
    }
    console.log(`  Inserted ${Object.keys(defaultSettings).length} settings`);
  } else {
    console.log(`Settings already seeded (${existingSettings.length} found)`);
  }

  const existingSocial = await db.select().from(schema.socialLinks);
  if (existingSocial.length === 0) {
    console.log("Seeding social links...");
    const defaultLinks = [
      { platform: "instagram", label: "Instagram", url: "https://instagram.com", sortOrder: 0 },
      { platform: "twitter", label: "Twitter", url: "https://twitter.com", sortOrder: 1 },
      { platform: "email", label: "Email", url: "mailto:hello@example.com", sortOrder: 2 },
    ];
    for (const link of defaultLinks) {
      await db.insert(schema.socialLinks).values(link);
    }
    console.log(`  Inserted ${defaultLinks.length} social links`);
  } else {
    console.log(`Social links already seeded (${existingSocial.length} found)`);
  }

  console.log("Done!");
}

seed().catch(console.error);
