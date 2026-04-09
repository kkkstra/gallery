"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function SortablePhotoRow({
  photo,
  isSelected,
  onToggle,
  onEdit,
  onDelete,
  canDrag,
}: {
  photo: Photo;
  isSelected: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canDrag: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id,
    disabled: !canDrag,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isSelected ? "bg-white/[0.07]" : ""}`}
    >
      {canDrag && (
        <td className="px-2 py-3">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 text-neutral-600 hover:text-neutral-400 transition-colors touch-none"
            {...listeners}
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5" />
              <circle cx="11" cy="3" r="1.5" />
              <circle cx="5" cy="8" r="1.5" />
              <circle cx="11" cy="8" r="1.5" />
              <circle cx="5" cy="13" r="1.5" />
              <circle cx="11" cy="13" r="1.5" />
            </svg>
          </button>
        </td>
      )}
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggle}
          className="rounded border-white/20 bg-transparent cursor-pointer accent-white"
        />
      </td>
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
            onClick={onEdit}
            className="rounded-lg px-3 py-1.5 text-xs text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg px-3 py-1.5 text-xs text-red-400/70 border border-red-500/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminPhotosPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [batchEditOpen, setBatchEditOpen] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [editFeatured, setEditFeatured] = useState<"" | "true" | "false">("");
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
    setSelected((prev) => { const s = new Set(prev); s.delete(id); return s; });
    fetchPhotos();
  };

  const allSelected = useMemo(
    () => photos.length > 0 && photos.every((p) => selected.has(p.id)),
    [photos, selected],
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(photos.map((p) => p.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const handleBatchDelete = async () => {
    if (!confirm(`Delete ${selected.size} photo(s)?`)) return;
    const res = await fetch("/api/photos/batch", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    if (res.ok) {
      setSelected(new Set());
      fetchPhotos();
    }
  };

  const handleBatchEdit = async () => {
    const changes: Record<string, unknown> = {};
    if (editCategory) changes.categorySlug = editCategory;
    if (editFeatured !== "") changes.featured = editFeatured === "true";

    if (Object.keys(changes).length === 0) return;

    const res = await fetch("/api/photos/batch", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), changes }),
    });
    if (res.ok) {
      setBatchEditOpen(false);
      setEditCategory("");
      setEditFeatured("");
      fetchPhotos();
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const canDrag = !search && !filterCategory;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(photos, oldIndex, newIndex);
    setPhotos(reordered);

    await fetch("/api/photos/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: reordered.map((p) => p.id) }),
    });
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="overflow-hidden rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-left">
                  {canDrag && <th className="px-2 py-3 w-8" />}
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="rounded border-white/20 bg-transparent cursor-pointer accent-white"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Preview</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Title</th>
                  <th className="px-4 py-3 font-medium text-neutral-400 hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 font-medium text-neutral-400 hidden lg:table-cell">Dimensions</th>
                  <th className="px-4 py-3 font-medium text-neutral-400">Featured</th>
                  <th className="px-4 py-3 font-medium text-neutral-400 text-right">Actions</th>
                </tr>
              </thead>
              <SortableContext items={photos.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                <tbody>
                  {photos.map((photo) => (
                    <SortablePhotoRow
                      key={photo.id}
                      photo={photo}
                      isSelected={selected.has(photo.id)}
                      onToggle={() => toggleSelect(photo.id)}
                      onEdit={() => router.push(`/admin/photos/${photo.id}/edit`)}
                      onDelete={() => handleDelete(photo.id)}
                      canDrag={canDrag}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </DndContext>
      )}

      {/* Floating action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur px-5 py-3 shadow-2xl">
          <span className="text-sm text-white mr-2">{selected.size} selected</span>
          <button
            type="button"
            onClick={() => { setBatchEditOpen(true); setEditCategory(""); setEditFeatured(""); }}
            className="rounded-lg bg-white/10 px-4 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
          >
            Edit Selected
          </button>
          <button
            type="button"
            onClick={handleBatchDelete}
            className="rounded-lg bg-red-500/20 px-4 py-1.5 text-sm text-red-400 hover:bg-red-500/30 transition-colors"
          >
            Delete Selected
          </button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-1 p-1.5 text-neutral-400 hover:text-white transition-colors"
            aria-label="Deselect all"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Batch edit modal */}
      {batchEditOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setBatchEditOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-light text-white mb-4">
              Edit {selected.size} Photo{selected.size > 1 ? "s" : ""}
            </h2>
            <p className="text-xs text-neutral-500 mb-5">
              Only changed fields will be applied.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className={`${inputClass} w-full`}
                >
                  <option value="">— No change —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Featured</label>
                <select
                  value={editFeatured}
                  onChange={(e) => setEditFeatured(e.target.value as "" | "true" | "false")}
                  className={`${inputClass} w-full`}
                >
                  <option value="">— No change —</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setBatchEditOpen(false)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchEdit}
                disabled={!editCategory && editFeatured === ""}
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
