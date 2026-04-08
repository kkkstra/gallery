"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { marked } from "marked";

interface CollectionPhoto {
  id: number;
  src: string;
  thumbnail: string | null;
  title: string;
  cpId: number;
}

interface AvailablePhoto {
  id: number;
  src: string;
  thumbnail: string | null;
  title: string;
}

export default function EditCollectionPage() {
  const router = useRouter();
  const params = useParams();
  const collectionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [allPhotos, setAllPhotos] = useState<AvailablePhoto[]>([]);
  const [collectionPhotos, setCollectionPhotos] = useState<CollectionPhoto[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    coverPhotoId: null as number | null,
    sortOrder: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch(`/api/collections/${collectionId}`).then((r) => r.json()),
      fetch(`/api/collections/${collectionId}/photos`).then((r) => r.json()),
    ]).then(([col, photos]) => {
      setForm({
        title: col.title,
        slug: col.slug,
        description: col.description || "",
        coverPhotoId: col.coverPhotoId,
        sortOrder: col.sortOrder || 0,
      });
      setCollectionPhotos(photos);
      setLoading(false);
    });
  }, [collectionId]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/collections/${collectionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
  };

  const openPicker = async () => {
    const res = await fetch("/api/photos");
    const data = await res.json();
    setAllPhotos(data);
    setSelectedIds(new Set());
    setShowPicker(true);
  };

  const addSelectedPhotos = async () => {
    if (selectedIds.size === 0) return;
    await fetch(`/api/collections/${collectionId}/photos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds: Array.from(selectedIds) }),
    });
    const res = await fetch(`/api/collections/${collectionId}/photos`);
    setCollectionPhotos(await res.json());
    setShowPicker(false);
  };

  const removePhoto = async (photoId: number) => {
    await fetch(`/api/collections/${collectionId}/photos?photoId=${photoId}`, {
      method: "DELETE",
    });
    setCollectionPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-neutral-600 outline-none focus:border-white/30 transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-neutral-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">Edit Collection</h1>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-neutral-400">Description (Markdown)</label>
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`px-3 py-1 text-xs transition-colors ${!previewMode ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`px-3 py-1 text-xs transition-colors ${previewMode ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
              >
                Preview
              </button>
            </div>
          </div>
          {previewMode ? (
            <div
              className="prose-dark min-h-[150px] rounded-lg border border-white/10 bg-white/5 p-6"
              dangerouslySetInnerHTML={{
                __html: marked.parse(form.description || "", { async: false }) as string,
              }}
            />
          ) : (
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={6}
              className={`${inputClass} font-mono text-sm`}
              placeholder="Write a description..."
            />
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Cover Photo</label>
          {collectionPhotos.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {collectionPhotos.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setForm({ ...form, coverPhotoId: p.id })}
                  className={`relative h-16 w-24 overflow-hidden rounded-lg border-2 transition-colors ${
                    form.coverPhotoId === p.id ? "border-white" : "border-transparent hover:border-white/30"
                  }`}
                >
                  <Image src={p.thumbnail || p.src} alt={p.title} fill className="object-cover" sizes="96px" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-600">Add photos first to select a cover.</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Sort Order</label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Collection"}
          </button>
          <button
            onClick={() => router.push("/admin/collections")}
            className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Photos in collection */}
      <div className="mt-10 border-t border-white/10 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium uppercase tracking-widest text-neutral-400">
            Photos ({collectionPhotos.length})
          </h2>
          <button
            onClick={openPicker}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Photos
          </button>
        </div>

        {collectionPhotos.length === 0 ? (
          <p className="text-sm text-neutral-600 py-8 text-center">
            No photos in this collection yet.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            {collectionPhotos.map((p) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg bg-white/5">
                <Image src={p.thumbnail || p.src} alt={p.title} fill className="object-cover" sizes="120px" />
                <button
                  onClick={() => removePhoto(p.id)}
                  className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-light">Select Photos</h3>
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-400">{selectedIds.size} selected</span>
                <button
                  onClick={addSelectedPhotos}
                  disabled={selectedIds.size === 0}
                  className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  Add Selected
                </button>
                <button onClick={() => setShowPicker(false)} className="text-neutral-400 hover:text-white transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="overflow-y-auto p-4 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-2">
              {allPhotos.map((p) => {
                const inCollection = collectionPhotos.some((cp) => cp.id === p.id);
                const selected = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => !inCollection && toggleSelect(p.id)}
                    disabled={inCollection}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-colors ${
                      inCollection
                        ? "border-transparent opacity-40 cursor-not-allowed"
                        : selected
                          ? "border-white"
                          : "border-transparent hover:border-white/30"
                    }`}
                  >
                    <Image src={p.thumbnail || p.src} alt={p.title} fill className="object-cover" sizes="100px" />
                    {selected && (
                      <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
