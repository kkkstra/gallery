"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ImageUploader, { UploadResult } from "./ImageUploader";

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Equipment {
  id: number;
  brand: string;
  model: string;
}

interface PhotoFormProps {
  initialData?: {
    id?: number;
    src: string;
    thumbnail: string;
    title: string;
    titleZh?: string | null;
    description: string;
    descriptionZh?: string | null;
    categorySlug: string;
    width: number;
    height: number;
    featured: boolean;
    sortOrder: number;
    camera: string;
    lens: string;
    aperture: string;
    shutterSpeed: string;
    iso: string;
    focalLength: string;
    takenAt: string;
    location: string;
  };
}

type ImageMode = "upload" | "url";

export default function PhotoForm({ initialData }: PhotoFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [camerasList, setCamerasList] = useState<Equipment[]>([]);
  const [lensesList, setLensesList] = useState<Equipment[]>([]);
  const [locationsList, setLocationsList] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showExif, setShowExif] = useState(
    !!(initialData?.camera || initialData?.lens || initialData?.aperture),
  );

  const [ossAvailable, setOssAvailable] = useState<boolean | null>(null);
  const [imageMode, setImageMode] = useState<ImageMode>("upload");
  const [uploaded, setUploaded] = useState(false);

  const [form, setForm] = useState({
    src: initialData?.src || "",
    thumbnail: initialData?.thumbnail || "",
    title: initialData?.title || "",
    titleZh: initialData?.titleZh || "",
    description: initialData?.description || "",
    descriptionZh: initialData?.descriptionZh || "",
    categorySlug: initialData?.categorySlug || "",
    width: initialData?.width || 1920,
    height: initialData?.height || 1280,
    featured: initialData?.featured || false,
    sortOrder: initialData?.sortOrder || 0,
    camera: initialData?.camera || "",
    lens: initialData?.lens || "",
    aperture: initialData?.aperture || "",
    shutterSpeed: initialData?.shutterSpeed || "",
    iso: initialData?.iso || "",
    focalLength: initialData?.focalLength || "",
    takenAt: initialData?.takenAt || "",
    location: initialData?.location || "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/cameras").then((r) => r.json()),
      fetch("/api/lenses").then((r) => r.json()),
      fetch("/api/upload/status").then((r) => r.json()).catch(() => ({ configured: false })),
      fetch("/api/photos").then((r) => r.json()).catch(() => []),
    ]).then(([cats, cams, lens, oss, allPhotos]) => {
      setCategories(cats);
      setCamerasList(cams);
      setLensesList(lens);
      const locs = [...new Set(
        (allPhotos as { location?: string }[])
          .map((p) => p.location)
          .filter(Boolean) as string[],
      )].sort();
      setLocationsList(locs);
      setOssAvailable(!!oss.configured);
      if (!oss.configured && !initialData?.src) {
        setImageMode("upload");
      }
      if (initialData?.src) {
        setImageMode("url");
      }
      if (!form.categorySlug && cats.length > 0) {
        setForm((prev) => ({ ...prev, categorySlug: cats[0].slug }));
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = (result: UploadResult) => {
    const { exif } = result;

    setForm((prev) => ({
      ...prev,
      src: result.src,
      thumbnail: result.thumbnail,
      width: result.width,
      height: result.height,
      camera: exif.camera || prev.camera,
      lens: exif.lens || prev.lens,
      aperture: exif.aperture || prev.aperture,
      shutterSpeed: exif.shutterSpeed || prev.shutterSpeed,
      iso: exif.iso || prev.iso,
      focalLength: exif.focalLength || prev.focalLength,
      takenAt: exif.takenAt || prev.takenAt,
      location: exif.location || prev.location,
    }));
    setUploaded(true);
    if (exif.aperture || exif.shutterSpeed || exif.iso || exif.camera || exif.lens) {
      setShowExif(true);
    }
  };

  const clearUpload = () => {
    setForm((prev) => ({ ...prev, src: "", thumbnail: "", width: 1920, height: 1280 }));
    setUploaded(false);
  };

  const resolveEquipmentId = (
    text: string,
    list: Equipment[],
  ): number | null => {
    if (!text.trim()) return null;
    const t = text.toLowerCase().trim();
    const match = list.find(
      (item) =>
        `${item.brand} ${item.model}`.toLowerCase() === t ||
        item.model.toLowerCase() === t,
    );
    return match?.id ?? null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const isEdit = !!initialData?.id;
      const url = isEdit ? `/api/photos/${initialData.id}` : "/api/photos";
      const method = isEdit ? "PUT" : "POST";

      const payload = {
        ...form,
        cameraId: resolveEquipmentId(form.camera, camerasList),
        lensId: resolveEquipmentId(form.lens, lensesList),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      {/* Image Source */}
      <div>
        <div className="flex gap-1 mb-3 p-0.5 bg-white/5 rounded-lg w-fit">
          <button
            type="button"
            onClick={() => setImageMode("upload")}
            className={`px-4 py-1.5 text-xs tracking-wider uppercase rounded-md transition-colors ${
              imageMode === "upload"
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Upload
          </button>
          <button
            type="button"
            onClick={() => setImageMode("url")}
            className={`px-4 py-1.5 text-xs tracking-wider uppercase rounded-md transition-colors ${
              imageMode === "url"
                ? "bg-white/15 text-white"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            URL
          </button>
        </div>

        {imageMode === "upload" ? (
          <div>
            {ossAvailable === null ? (
              <div className="flex items-center justify-center py-8 text-sm text-neutral-500">
                Checking upload service...
              </div>
            ) : ossAvailable === false ? (
              <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-5 space-y-2">
                <p className="text-sm text-yellow-400 flex items-center gap-2">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  OSS not configured
                </p>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  To enable direct image upload, set these environment variables in your deployment:
                </p>
                <div className="text-xs text-neutral-500 font-mono space-y-0.5 pl-1">
                  <p>ALIYUN_OSS_REGION</p>
                  <p>ALIYUN_OSS_BUCKET</p>
                  <p>ALIYUN_OSS_ACCESS_KEY_ID</p>
                  <p>ALIYUN_OSS_ACCESS_KEY_SECRET</p>
                </div>
                <p className="text-xs text-neutral-500 pt-1">
                  Switch to the <button type="button" onClick={() => setImageMode("url")} className="text-white underline underline-offset-2">URL</button> tab to paste an image link instead.
                </p>
              </div>
            ) : uploaded && form.src ? (
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <div className="relative h-40 w-60 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    <Image
                      src={form.src}
                      alt="Uploaded"
                      fill
                      className="object-cover"
                      sizes="240px"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <p className="text-sm text-green-400 flex items-center gap-1.5">
                      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Uploaded successfully
                    </p>
                    <p className="text-xs text-neutral-500 break-all">{form.src}</p>
                    <p className="text-xs text-neutral-500">{form.width} x {form.height}px</p>
                    <button
                      type="button"
                      onClick={clearUpload}
                      className="text-xs text-neutral-400 hover:text-white transition-colors underline underline-offset-2"
                    >
                      Clear & re-upload
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <ImageUploader onUpload={handleUpload} />
            )}
          </div>
        ) : (
          <>
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

            <div className="mt-4">
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
          </>
        )}
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">Title *</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 w-8 shrink-0">EN</span>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Photo title"
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
        <label className="block text-sm text-neutral-400 mb-1.5">Description</label>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <span className="text-xs text-neutral-500 w-8 shrink-0 pt-2.5">EN</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Short description (optional)"
              rows={3}
              className={inputClass}
            />
          </div>
          <div className="flex items-start gap-2">
            <span className="text-xs text-neutral-500 w-8 shrink-0 pt-2.5">中文</span>
            <textarea
              value={form.descriptionZh}
              onChange={(e) => setForm({ ...form, descriptionZh: e.target.value })}
              placeholder="中文描述（可选）"
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-400 mb-1.5">Category *</label>
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
            onChange={(e) =>
              setForm({ ...form, width: Number(e.target.value) })
            }
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
            onChange={(e) =>
              setForm({ ...form, height: Number(e.target.value) })
            }
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
            onChange={(e) =>
              setForm({ ...form, sortOrder: Number(e.target.value) })
            }
            className={inputClass}
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                setForm({ ...form, featured: e.target.checked })
              }
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-white"
            />
            <span className="text-sm text-neutral-300">
              Featured on homepage
            </span>
          </label>
        </div>
      </div>

      {/* EXIF / Shooting Details */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowExif(!showExif)}
          className="flex items-center justify-between w-full px-4 py-3 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <span>Shooting Details</span>
          <svg
            className={`h-4 w-4 transition-transform ${showExif ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
        </button>

        {showExif && (
          <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Camera
                </label>
                <input
                  type="text"
                  list="cameras-list"
                  value={form.camera}
                  onChange={(e) =>
                    setForm({ ...form, camera: e.target.value })
                  }
                  placeholder="Select or type camera name"
                  className={inputClass}
                />
                <datalist id="cameras-list">
                  {camerasList.map((c) => (
                    <option key={c.id} value={`${c.brand} ${c.model}`} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Lens
                </label>
                <input
                  type="text"
                  list="lenses-list"
                  value={form.lens}
                  onChange={(e) =>
                    setForm({ ...form, lens: e.target.value })
                  }
                  placeholder="Select or type lens name"
                  className={inputClass}
                />
                <datalist id="lenses-list">
                  {lensesList.map((l) => (
                    <option key={l.id} value={`${l.brand} ${l.model}`} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Aperture
                </label>
                <input
                  type="text"
                  value={form.aperture}
                  onChange={(e) =>
                    setForm({ ...form, aperture: e.target.value })
                  }
                  placeholder="f/2.8"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Shutter Speed
                </label>
                <input
                  type="text"
                  value={form.shutterSpeed}
                  onChange={(e) =>
                    setForm({ ...form, shutterSpeed: e.target.value })
                  }
                  placeholder="1/250s"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  ISO
                </label>
                <input
                  type="text"
                  value={form.iso}
                  onChange={(e) => setForm({ ...form, iso: e.target.value })}
                  placeholder="400"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Focal Length
                </label>
                <input
                  type="text"
                  value={form.focalLength}
                  onChange={(e) =>
                    setForm({ ...form, focalLength: e.target.value })
                  }
                  placeholder="50mm"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Date Taken
                </label>
                <input
                  type="date"
                  value={form.takenAt}
                  onChange={(e) =>
                    setForm({ ...form, takenAt: e.target.value })
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm text-neutral-400 mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  list="locations-list"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                  placeholder="Tokyo, Japan"
                  className={inputClass}
                />
                <datalist id="locations-list">
                  {locationsList.map((loc) => (
                    <option key={loc} value={loc} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>
        )}
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
