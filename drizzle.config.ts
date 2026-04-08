import { defineConfig } from "drizzle-kit";

const tursoUrl = process.env.TURSO_DATABASE_URL;

export default tursoUrl
  ? defineConfig({
      schema: "./src/lib/db/schema.ts",
      out: "./drizzle",
      dialect: "turso",
      dbCredentials: {
        url: tursoUrl,
        authToken: process.env.TURSO_AUTH_TOKEN,
      },
    })
  : defineConfig({
      schema: "./src/lib/db/schema.ts",
      out: "./drizzle",
      dialect: "sqlite",
      dbCredentials: {
        url: "file:./data/gallery.db",
      },
    });
