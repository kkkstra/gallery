"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Collection {
  id: number;
  title: string;
  slug: string;
  coverSrc: string | null;
  photoCount: number;
  sortOrder: number;
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCollections = async () => {
    const res = await fetch("/api/collections");
    const data = await res.json();
    setCollections(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this collection? Photos won't be deleted.")) return;
    await fetch(`/api/collections/${id}`, { method: "DELETE" });
    fetchCollections();
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
          <h1 className="text-2xl font-light tracking-wider text-white">Collections</h1>
          <p className="mt-1 text-sm text-neutral-500">{collections.length} collections</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-neutral-500">No collections yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map((col) => (
            <div
              key={col.id}
              className="group rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-colors"
            >
              <div className="relative aspect-[16/9] bg-white/5">
                {col.coverSrc ? (
                  <Image
                    src={col.coverSrc}
                    alt={col.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-600">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18.75h19.5M2.25 5.25a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v13.5" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-white font-light tracking-wide">{col.title}</h3>
                <p className="text-xs text-neutral-500 mt-1">{col.photoCount} photos</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => router.push(`/admin/collections/${col.id}/edit`)}
                    className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(col.id)}
                    className="rounded-lg px-3 py-1.5 text-xs text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
