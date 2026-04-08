"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setSaving(false);
    fetchCategories();
  };

  const handleUpdate = async (id: number) => {
    if (!editName.trim()) return;
    setSaving(true);
    await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim() }),
    });
    setEditingId(null);
    setEditName("");
    setSaving(false);
    fetchCategories();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category? Photos using it may become orphaned."))
      return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    fetchCategories();
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
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">
          Categories
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {categories.length} categories
        </p>
      </div>

      {/* Add new category */}
      <form
        onSubmit={handleAdd}
        className="flex gap-3 mb-8 max-w-md"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white placeholder-neutral-600 outline-none focus:border-white/30 transition-colors"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          Add
        </button>
      </form>

      {/* Category list */}
      <div className="overflow-hidden rounded-xl border border-white/10 max-w-lg">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors"
          >
            {editingId === cat.id ? (
              <div className="flex items-center gap-2 flex-1 mr-3">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 rounded border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-white/40"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(cat.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button
                  onClick={() => handleUpdate(cat.id)}
                  disabled={saving}
                  className="text-xs text-emerald-400 hover:text-emerald-300"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs text-neutral-500 hover:text-neutral-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div>
                  <span className="text-white">{cat.name}</span>
                  <span className="ml-2 text-xs text-neutral-600">
                    {cat.slug}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(cat.id);
                      setEditName(cat.name);
                    }}
                    className="rounded px-2.5 py-1 text-xs text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="rounded px-2.5 py-1 text-xs text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
