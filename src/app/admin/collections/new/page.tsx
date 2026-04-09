"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";

export default function NewCollectionPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [previewDescEn, setPreviewDescEn] = useState(false);
  const [previewDescZh, setPreviewDescZh] = useState(false);
  const [form, setForm] = useState({
    title: "",
    titleZh: "",
    slug: "",
    description: "",
    descriptionZh: "",
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-8 shrink-0">EN</span>
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
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-500 w-8 shrink-0">中文</span>
              <input
                type="text"
                value={form.titleZh}
                onChange={(e) => setForm({ ...form, titleZh: e.target.value })}
                placeholder="中文标题（可选）"
                className={inputClass}
              />
            </div>
          </div>
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
          <label className="block text-sm text-neutral-400 mb-1.5">Description (Markdown)</label>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-neutral-500">EN</span>
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewDescEn(false)}
                    className={`px-3 py-1 text-xs transition-colors ${!previewDescEn ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDescEn(true)}
                    className={`px-3 py-1 text-xs transition-colors ${previewDescEn ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
                  >
                    Preview
                  </button>
                </div>
              </div>
              {previewDescEn ? (
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
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-neutral-500">中文</span>
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPreviewDescZh(false)}
                    className={`px-3 py-1 text-xs transition-colors ${!previewDescZh ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDescZh(true)}
                    className={`px-3 py-1 text-xs transition-colors ${previewDescZh ? "bg-white/10 text-white" : "text-neutral-500 hover:text-white"}`}
                  >
                    Preview
                  </button>
                </div>
              </div>
              {previewDescZh ? (
                <div
                  className="prose-dark min-h-[150px] rounded-lg border border-white/10 bg-white/5 p-6"
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(form.descriptionZh || "", { async: false }) as string,
                  }}
                />
              ) : (
                <textarea
                  value={form.descriptionZh}
                  onChange={(e) => setForm({ ...form, descriptionZh: e.target.value })}
                  rows={6}
                  className={`${inputClass} font-mono text-sm`}
                  placeholder="中文描述（可选）..."
                />
              )}
            </div>
          </div>
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
