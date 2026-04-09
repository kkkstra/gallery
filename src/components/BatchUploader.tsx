"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { processAndUploadFile, type UploadResult } from "@/lib/upload-utils";

interface FileItem {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "processing" | "uploading" | "saving" | "done" | "error";
  progress: number;
  error?: string;
  result?: UploadResult;
  photoId?: number;
  editData?: EditData;
  saving?: boolean;
  saved?: boolean;
}

interface EditData {
  title: string;
  description: string;
  categorySlug: string;
  location: string;
  camera: string;
  lens: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  focalLength: string;
  takenAt: string;
  featured: boolean;
}

const MAX_CONCURRENT = 2;

export default function BatchUploader() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [category, setCategory] = useState("");
  const [categories, setCategoriesState] = useState<{ slug: string; name: string }[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const categoriesFetched = useRef(false);

  useEffect(() => {
    if (categoriesFetched.current) return;
    categoriesFetched.current = true;
    fetch("/api/categories")
      .then((r) => r.json())
      .then((cats) => {
        setCategoriesState(cats);
        if (cats.length > 0 && !category) setCategory(cats[0].slug);
      })
      .catch(() => {});
    fetch("/api/photos/filters")
      .then((r) => r.json())
      .then((f) => setLocations(f.locations || []))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const items: FileItem[] = Array.from(newFiles)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
        status: "pending" as const,
        progress: 0,
      }));
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const updateFile = useCallback((id: string, patch: Partial<FileItem>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }, []);

  const processOne = useCallback(
    async (item: FileItem) => {
      updateFile(item.id, { status: "uploading", progress: 0 });
      try {
        const result = await processAndUploadFile(item.file, (pct) =>
          updateFile(item.id, { progress: pct }),
        );

        updateFile(item.id, { status: "saving" });
        const title = item.file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        const body = {
          src: result.src,
          thumbnail: result.thumbnail,
          title,
          categorySlug: category,
          width: result.width,
          height: result.height,
          camera: result.exif.camera || "",
          lens: result.exif.lens || "",
          aperture: result.exif.aperture || "",
          shutterSpeed: result.exif.shutterSpeed || "",
          iso: result.exif.iso || "",
          focalLength: result.exif.focalLength || "",
          takenAt: result.exif.takenAt || "",
          location: result.exif.location || "",
        };

        const res = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to save photo");
        const photo = await res.json();

        updateFile(item.id, {
          status: "done",
          progress: 100,
          result,
          photoId: photo.id,
          editData: {
            title,
            description: "",
            categorySlug: category,
            location: result.exif.location || "",
            camera: result.exif.camera || "",
            lens: result.exif.lens || "",
            aperture: result.exif.aperture || "",
            shutterSpeed: result.exif.shutterSpeed || "",
            iso: result.exif.iso || "",
            focalLength: result.exif.focalLength || "",
            takenAt: result.exif.takenAt || "",
            featured: false,
          },
        });
      } catch (err) {
        updateFile(item.id, {
          status: "error",
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
    [category, updateFile],
  );

  const startUpload = useCallback(async () => {
    setIsRunning(true);
    const pending = files.filter((f) => f.status === "pending" || f.status === "error");
    let idx = 0;
    const workers: Promise<void>[] = [];

    const runNext = async (): Promise<void> => {
      while (idx < pending.length) {
        const item = pending[idx++];
        await processOne(item);
      }
    };

    for (let i = 0; i < Math.min(MAX_CONCURRENT, pending.length); i++) {
      workers.push(runNext());
    }
    await Promise.all(workers);
    setIsRunning(false);
  }, [files, processOne]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const updateEditField = useCallback((fileId: string, field: keyof EditData, value: string | boolean) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId && f.editData
          ? { ...f, editData: { ...f.editData, [field]: value }, saved: false }
          : f,
      ),
    );
  }, []);

  const saveOne = useCallback(async (item: FileItem) => {
    if (!item.photoId || !item.editData) return;
    updateFile(item.id, { saving: true });
    try {
      const existing = await fetch(`/api/photos/${item.photoId}`).then((r) => r.json());
      const res = await fetch(`/api/photos/${item.photoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...existing,
          title: item.editData.title,
          description: item.editData.description,
          categorySlug: item.editData.categorySlug,
          location: item.editData.location,
          camera: item.editData.camera,
          lens: item.editData.lens,
          aperture: item.editData.aperture,
          shutterSpeed: item.editData.shutterSpeed,
          iso: item.editData.iso,
          focalLength: item.editData.focalLength,
          takenAt: item.editData.takenAt,
          featured: item.editData.featured,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      updateFile(item.id, { saving: false, saved: true });
    } catch {
      updateFile(item.id, { saving: false });
    }
  }, [updateFile]);

  const saveAll = useCallback(async () => {
    const toSave = files.filter((f) => f.status === "done" && f.photoId && !f.saved);
    for (const item of toSave) {
      await saveOne(item);
    }
  }, [files, saveOne]);

  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  const inputClass =
    "rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30 transition-colors w-full";
  const labelClass = "text-[10px] text-neutral-500 uppercase tracking-wider";

  const allDone = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");
  const unsavedCount = files.filter((f) => f.status === "done" && !f.saved).length;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Category selector */}
      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">
          Category for all uploads *
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass + " max-w-xs"}
        >
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Drop zone */}
      {!editMode && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => !isRunning && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 cursor-pointer transition-colors ${
            dragOver
              ? "border-white/50 bg-white/10"
              : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="hidden"
          />
          <svg className="h-10 w-10 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
          </svg>
          <p className="text-sm text-neutral-300">
            Drag & drop multiple images, or click to browse
          </p>
          <p className="text-xs text-neutral-500">
            EXIF auto-read &middot; Thumbnails auto-generated &middot; 2 concurrent uploads
          </p>
        </div>
      )}

      {/* File list / upload phase */}
      {files.length > 0 && !editMode && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-400">
              {files.length} file{files.length !== 1 ? "s" : ""}
              {doneCount > 0 && <span className="text-green-400"> &middot; {doneCount} done</span>}
              {errorCount > 0 && <span className="text-red-400"> &middot; {errorCount} failed</span>}
            </p>
            <div className="flex gap-2">
              {!isRunning && files.some((f) => f.status === "pending" || f.status === "error") && (
                <button
                  type="button"
                  onClick={startUpload}
                  disabled={!category}
                  className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  Upload ({files.filter((f) => f.status === "pending" || f.status === "error").length})
                </button>
              )}
              {!isRunning && allDone && doneCount > 0 && (
                <button
                  type="button"
                  onClick={() => setEditMode(true)}
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-500 transition-colors"
                >
                  Edit Uploaded Photos
                </button>
              )}
              {!isRunning && (
                <button
                  type="button"
                  onClick={() => {
                    files.forEach((f) => URL.revokeObjectURL(f.preview));
                    setFiles([]);
                  }}
                  className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {files.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.preview}
                  alt=""
                  className="h-12 w-12 rounded object-cover shrink-0 bg-white/5"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">
                    {item.file.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.status === "pending" && (
                      <span className="text-xs text-neutral-500">Waiting...</span>
                    )}
                    {(item.status === "processing" || item.status === "uploading") && (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-neutral-400 shrink-0">{item.progress}%</span>
                      </div>
                    )}
                    {item.status === "saving" && (
                      <span className="text-xs text-blue-400">Saving...</span>
                    )}
                    {item.status === "done" && (
                      <span className="text-xs text-green-400">Done</span>
                    )}
                    {item.status === "error" && (
                      <span className="text-xs text-red-400 truncate">{item.error}</span>
                    )}
                  </div>
                </div>
                {!isRunning && item.status !== "done" && (
                  <button
                    type="button"
                    onClick={() => removeFile(item.id)}
                    className="p-1 text-neutral-500 hover:text-white transition-colors shrink-0"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editMode && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">
              Edit Uploaded Photos ({doneCount})
            </h3>
            <div className="flex gap-2">
              {unsavedCount > 0 && (
                <button
                  type="button"
                  onClick={saveAll}
                  className="rounded-lg bg-white px-4 py-1.5 text-sm font-medium text-black hover:opacity-90 transition-opacity"
                >
                  Save All ({unsavedCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="rounded-lg border border-white/10 px-4 py-1.5 text-sm text-neutral-400 hover:text-white hover:border-white/30 transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {files.filter((f) => f.status === "done" && f.editData).map((item) => (
              <div
                key={item.id}
                className={`rounded-lg border p-4 transition-colors ${
                  item.saved
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex gap-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt=""
                    className="h-24 w-24 rounded-lg object-cover shrink-0 bg-white/5"
                  />
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Row 1: Title + Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Title</label>
                        <input
                          type="text"
                          value={item.editData!.title}
                          onChange={(e) => updateEditField(item.id, "title", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Category</label>
                        <select
                          value={item.editData!.categorySlug}
                          onChange={(e) => updateEditField(item.id, "categorySlug", e.target.value)}
                          className={inputClass}
                        >
                          {categories.map((c) => (
                            <option key={c.slug} value={c.slug}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Row 2: Description */}
                    <div>
                      <label className={labelClass}>Description</label>
                      <textarea
                        value={item.editData!.description}
                        onChange={(e) => updateEditField(item.id, "description", e.target.value)}
                        rows={2}
                        className={inputClass + " resize-none"}
                      />
                    </div>

                    {/* Row 3: Location + Date + Featured */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className={labelClass}>Location</label>
                        <input
                          type="text"
                          list={`loc-${item.id}`}
                          value={item.editData!.location}
                          onChange={(e) => updateEditField(item.id, "location", e.target.value)}
                          className={inputClass}
                        />
                        <datalist id={`loc-${item.id}`}>
                          {locations.map((l) => <option key={l} value={l} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className={labelClass}>Date Taken</label>
                        <input
                          type="text"
                          value={item.editData!.takenAt}
                          onChange={(e) => updateEditField(item.id, "takenAt", e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="flex items-end pb-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.editData!.featured}
                            onChange={(e) => updateEditField(item.id, "featured", e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-neutral-300">Featured</span>
                        </label>
                      </div>
                    </div>

                    {/* Row 4: EXIF (collapsed, read-only display) */}
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-neutral-500">
                      {item.editData!.camera && <span>{item.editData!.camera}</span>}
                      {item.editData!.lens && <span>{item.editData!.lens}</span>}
                      {item.editData!.aperture && <span>f/{item.editData!.aperture}</span>}
                      {item.editData!.shutterSpeed && <span>{item.editData!.shutterSpeed}s</span>}
                      {item.editData!.iso && <span>ISO {item.editData!.iso}</span>}
                      {item.editData!.focalLength && <span>{item.editData!.focalLength}mm</span>}
                    </div>
                  </div>

                  {/* Save button per card */}
                  <div className="shrink-0 flex flex-col items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveOne(item)}
                      disabled={item.saving || item.saved}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        item.saved
                          ? "bg-green-600/20 text-green-400 cursor-default"
                          : item.saving
                            ? "bg-white/10 text-neutral-500 cursor-wait"
                            : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {item.saved ? "Saved" : item.saving ? "..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
