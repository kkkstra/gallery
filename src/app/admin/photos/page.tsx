"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Photo {
  id: number;
  src: string;
  thumbnail: string | null;
  title: string;
  description: string | null;
  categorySlug: string;
  width: number;
  height: number;
  featured: boolean | number;
  sortOrder: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const router = useRouter();

  const fetchPhotos = async () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (filterCategory) params.set("category", filterCategory);
    const qs = params.toString();
    const res = await fetch(`/api/photos${qs ? `?${qs}` : ""}`);
    const data = await res.json();
    setPhotos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => fetchPhotos(), 300);
    return () => clearTimeout(timer);
  }, [search, filterCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    fetchPhotos();
  };

  const inputClass =
    "rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-neutral-600 outline-none focus:border-white/30 transition-colors";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light tracking-wider text-white">Photos</h1>
          <p className="mt-1 text-sm text-neutral-500">{photos.length} photos</p>
        </div>
        <Link
          href="/admin/photos/new"
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Photo
        </Link>
      </div>

      {/* Search & Filter toolbar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search photos..."
            className={`${inputClass} pl-10 w-full`}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className={`${inputClass} w-44`}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-neutral-500">Loading...</p>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500">No photos found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-left">
                <th className="px-4 py-3 font-medium text-neutral-400">Preview</th>
                <th className="px-4 py-3 font-medium text-neutral-400">Title</th>
                <th className="px-4 py-3 font-medium text-neutral-400 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 font-medium text-neutral-400 hidden lg:table-cell">Dimensions</th>
                <th className="px-4 py-3 font-medium text-neutral-400">Featured</th>
                <th className="px-4 py-3 font-medium text-neutral-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {photos.map((photo) => (
                <tr key={photo.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-16 overflow-hidden rounded bg-white/10">
                      <Image src={photo.thumbnail || photo.src} alt={photo.title} fill className="object-cover" sizes="64px" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">{photo.title}</p>
                    {photo.description && (
                      <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[200px]">{photo.description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-400 hidden md:table-cell">
                    <span className="inline-block rounded-full border border-white/10 px-2.5 py-0.5 text-xs">
                      {photo.categorySlug}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">{photo.width}x{photo.height}</td>
                  <td className="px-4 py-3">
                    {photo.featured ? (
                      <span className="inline-block rounded-full bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs">Featured</span>
                    ) : (
                      <span className="text-neutral-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => router.push(`/admin/photos/${photo.id}/edit`)}
                        className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(photo.id)}
                        className="rounded-lg px-3 py-1.5 text-xs text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
