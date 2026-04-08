# Gallery — Photography Portfolio

A minimal, modern photography portfolio built with Next.js and Tailwind CSS. Features a responsive masonry grid, full-screen lightbox with animations, category filtering, and an admin panel for managing photos.

## Quick Start

```bash
npm install
npm run db:seed   # Create database and populate with sample photos
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the gallery, and [http://localhost:3000/admin](http://localhost:3000/admin) for the admin panel.

Default admin password: `admin123` (change in `.env.local`).

## Admin Panel

Access at `/admin` after logging in. Manage photos and categories through a web interface:

- **Dashboard**: Overview of photo and category counts
- **Photos**: Add, edit, delete photos. Set featured status, category, and sort order
- **Categories**: Create, rename, and delete categories

## Managing Photos via CDN

1. Upload your photo to your CDN or object storage (e.g. Cloudflare R2, AWS S3)
2. In the admin panel, click "Add Photo" and paste the CDN URL
3. Fill in title, description, category, and image dimensions
4. Save — the gallery updates immediately

### Image Domains

If your CDN uses a new domain, add it to `next.config.ts` under `images.remotePatterns`:

```typescript
{
  protocol: "https",
  hostname: "your-cdn-domain.com",
}
```

## Deploy to Vercel

Since Vercel is serverless (no persistent filesystem), the local SQLite file won't work. Use **Turso** — a hosted SQLite service with a generous free tier.

### Step 1: Create a Turso Database

```bash
# Install Turso CLI
brew install tursodatabase/tap/turso    # macOS
# or: curl -sSfL https://get.tur.so/install.sh | bash

# Sign up / log in
turso auth signup

# Create a database
turso db create gallery

# Get the connection URL
turso db show gallery --url
# Output: libsql://gallery-yourname.turso.io

# Create an auth token
turso db tokens create gallery
# Output: eyJhbG...
```

### Step 2: Seed the Turso Database

```bash
TURSO_DATABASE_URL=libsql://gallery-yourname.turso.io \
TURSO_AUTH_TOKEN=eyJhbG... \
npm run db:seed
```

### Step 3: Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository
3. Add these **Environment Variables** in Vercel project settings:

   | Variable | Value |
   |---|---|
   | `TURSO_DATABASE_URL` | `libsql://gallery-yourname.turso.io` |
   | `TURSO_AUTH_TOKEN` | `eyJhbG...` (your token) |
   | `ADMIN_PASSWORD` | Your admin password |
   | `JWT_SECRET` | A long random string |

4. Click **Deploy**
5. Every push to `main` triggers a new deployment

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `ADMIN_PASSWORD` | Yes | Password for the admin panel |
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens |
| `TURSO_DATABASE_URL` | Production | Turso database URL (`libsql://...`) |
| `TURSO_AUTH_TOKEN` | Production | Turso authentication token |

When `TURSO_DATABASE_URL` is not set, the app uses a local SQLite file at `data/gallery.db`.

## Customization

- **Site title/description**: Edit `src/app/layout.tsx` metadata
- **Navigation links**: Edit `src/components/Header.tsx`
- **About page content**: Edit `src/app/about/page.tsx`
- **Social links**: Edit `src/components/Footer.tsx`
- **Hero text**: Edit `src/components/Hero.tsx`
- **Colors & fonts**: Edit `src/app/globals.css` and `src/app/layout.tsx`

## Tech Stack

- [Next.js](https://nextjs.org) — React framework with image optimization
- [Tailwind CSS](https://tailwindcss.com) — Utility-first styling
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Drizzle ORM](https://orm.drizzle.team) — Type-safe database queries
- [Turso](https://turso.tech) / SQLite — Database (hosted or local)
- [Vercel](https://vercel.com) — Hosting & deployment
