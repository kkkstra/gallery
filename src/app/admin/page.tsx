import Link from "next/link";
import { db } from "@/lib/db";
import { photos, categories } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [photoRow] = await db.select({ value: count() }).from(photos);
  const [categoryRow] = await db.select({ value: count() }).from(categories);
  const [featuredRow] = await db
    .select({ value: count() })
    .from(photos)
    .where(eq(photos.featured, true));

  const stats = [
    { label: "Total Photos", value: photoRow.value, href: "/admin/photos" },
    { label: "Categories", value: categoryRow.value, href: "/admin/categories" },
    { label: "Featured", value: featuredRow.value, href: "/admin/photos" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Overview of your gallery
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
          >
            <p className="text-sm text-neutral-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-light text-white">{stat.value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/photos/new"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
        >
          <svg className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <div>
            <p className="text-white">Add New Photo</p>
            <p className="text-sm text-neutral-500">Upload a new photo to the gallery</p>
          </div>
        </Link>
        <Link
          href="/admin/categories"
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/10"
        >
          <svg className="h-8 w-8 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          </svg>
          <div>
            <p className="text-white">Manage Categories</p>
            <p className="text-sm text-neutral-500">Add, edit, or remove categories</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
