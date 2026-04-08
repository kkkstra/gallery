"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";

export default function NewCollectionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    sortOrder: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/collections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/collections/${data.id}/edit`);
    }
    setSaving(false);
  };

  const inputClass =
    "w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-neutral-600 outline-none focus:border-white/30 transition-colors";

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">New Collection</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
                slug: e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, ""),
              })
            }
            placeholder="Collection title"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1.5">Slug</label>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="collection-slug"
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
              placeholder="Write a description for this collection..."
            />
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

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Collection"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/collections")}
            className="rounded-lg border border-white/10 px-6 py-2.5 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
