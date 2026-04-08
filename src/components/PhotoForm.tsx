"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface PhotoFormProps {
  initialData?: {
    id?: number;
    src: string;
    thumbnail: string;
    title: string;
    description: string;
    categorySlug: string;
    width: number;
    height: number;
    featured: boolean;
    sortOrder: number;
  };
}

export default function PhotoForm({ initialData }: PhotoFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    src: initialData?.src || "",
    thumbnail: initialData?.thumbnail || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    categorySlug: initialData?.categorySlug || "",
    width: initialData?.width || 1920,
    height: initialData?.height || 1280,
    featured: initialData?.featured || false,
    sortOrder: initialData?.sortOrder || 0,
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        setCategories(data);
        if (!form.categorySlug && data.length > 0) {
          setForm((prev) => ({ ...prev, categorySlug: data[0].slug }));
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit
        ? `/api/photos/${initialData.id}`
        : "/api/photos";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      router.push("/admin/photos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-neutral-600 outline-none focus:border-white/30 transition-colors";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Image URL with preview */}
      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">
          Image URL *
        </label>
        <input
          type="url"
          required
          value={form.src}
          onChange={(e) => setForm({ ...form, src: e.target.value })}
          placeholder="https://your-cdn.com/photo.jpg"
          className={inputClass}
        />
        {form.src && (
          <div className="mt-2 relative h-40 w-60 overflow-hidden rounded-lg bg-white/5">
            <Image
              src={form.src}
              alt="Preview"
              fill
              className="object-cover"
              sizes="240px"
              unoptimized
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">
          Thumbnail URL
        </label>
        <input
          type="url"
          value={form.thumbnail}
          onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
          placeholder="https://your-cdn.com/photo-thumb.jpg (optional)"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">
          Title *
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Photo title"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">
          Description
        </label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Short description (optional)"
          rows={3}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">
          Category *
        </label>
        <select
          required
          value={form.categorySlug}
          onChange={(e) => setForm({ ...form, categorySlug: e.target.value })}
          className={inputClass}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">
            Width (px) *
          </label>
          <input
            type="number"
            required
            min={1}
            value={form.width}
            onChange={(e) => setForm({ ...form, width: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">
            Height (px) *
          </label>
          <input
            type="number"
            required
            min={1}
            value={form.height}
            onChange={(e) => setForm({ ...form, height: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">
            Sort Order
          </label>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            className={inputClass}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white"
            />
            <span className="text-sm text-neutral-300">Featured on homepage</span>
          </label>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : initialData?.id ? "Update Photo" : "Add Photo"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/photos")}
          className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
