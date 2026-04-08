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
  category_slug: string;
  width: number;
  height: number;
  featured: boolean | number;
  sort_order: number;
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchPhotos = async () => {
    const res = await fetch("/api/photos");
    const data = await res.json();
    setPhotos(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;
    await fetch(`/api/photos/${id}`, { method: "DELETE" });
    fetchPhotos();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-light tracking-wider text-white">
            Photos
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            {photos.length} photos in total
          </p>
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
              <tr
                key={photo.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="relative h-12 w-16 overflow-hidden rounded bg-white/10">
                    <Image
                      src={photo.thumbnail || photo.src}
                      alt={photo.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-white">{photo.title}</p>
                  {photo.description && (
                    <p className="text-xs text-neutral-500 mt-0.5 truncate max-w-[200px]">
                      {photo.description}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-neutral-400 hidden md:table-cell">
                  <span className="inline-block rounded-full border border-white/10 px-2.5 py-0.5 text-xs">
                    {photo.category_slug}
                  </span>
                </td>
                <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell">
                  {photo.width}x{photo.height}
                </td>
                <td className="px-4 py-3">
                  {photo.featured ? (
                    <span className="inline-block rounded-full bg-amber-500/20 text-amber-400 px-2.5 py-0.5 text-xs">
                      Featured
                    </span>
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
    </div>
  );
}
