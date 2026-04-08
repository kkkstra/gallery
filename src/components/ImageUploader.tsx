"use client";

import { useState, useRef, useCallback } from "react";
import ExifReader from "exifreader";

export interface ExifData {
  camera?: string;
  lens?: string;
  aperture?: string;
  shutterSpeed?: string;
  iso?: string;
  focalLength?: string;
  takenAt?: string;
  location?: string;
}

export interface UploadResult {
  src: string;
  thumbnail: string;
  width: number;
  height: number;
  exif: ExifData;
}

interface ImageUploaderProps {
  onUpload: (result: UploadResult) => void;
}

type UploadState = "idle" | "reading" | "signing" | "uploading" | "done" | "error";

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to read image"));
    };
    img.src = url;
  });
}

function formatShutterSpeed(val: number): string {
  if (val >= 1) return `${val}s`;
  const denom = Math.round(1 / val);
  return `1/${denom}s`;
}

function dmsToDecimal(
  degrees: number,
  minutes: number,
  seconds: number,
  ref: string,
): number {
  let dec = degrees + minutes / 60 + seconds / 3600;
  if (ref === "S" || ref === "W") dec = -dec;
  return dec;
}

async function readExif(file: File): Promise<ExifData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });

    const exif: ExifData = {};

    const exifTags = tags.exif || {};
    const gps = tags.gps || {};

    // Camera: Make + Model
    const make = exifTags.Make?.description?.trim();
    const model = exifTags.Model?.description?.trim();
    if (make && model) {
      exif.camera = model.startsWith(make) ? model : `${make} ${model}`;
    } else if (model) {
      exif.camera = model;
    }

    // Lens
    const lensModel = exifTags.LensModel?.description?.trim();
    if (lensModel) exif.lens = lensModel;

    // Aperture
    const fNumber = exifTags.FNumber?.value;
    if (fNumber) {
      const f = Array.isArray(fNumber) ? fNumber[0] / fNumber[1] : Number(fNumber);
      if (f > 0) exif.aperture = `f/${f % 1 === 0 ? f : f.toFixed(1)}`;
    }

    // Shutter Speed
    const exposure = exifTags.ExposureTime?.value;
    if (exposure) {
      const val = Array.isArray(exposure) ? exposure[0] / exposure[1] : Number(exposure);
      if (val > 0) exif.shutterSpeed = formatShutterSpeed(val);
    }

    // ISO
    const iso = exifTags.ISOSpeedRatings?.value;
    if (iso != null) {
      exif.iso = String(Array.isArray(iso) ? iso[0] : iso);
    }

    // Focal Length
    const fl = exifTags.FocalLength?.value;
    if (fl) {
      const mm = Array.isArray(fl) ? fl[0] / fl[1] : Number(fl);
      if (mm > 0) exif.focalLength = `${Math.round(mm)}mm`;
    }

    // Date Taken
    const dateStr =
      exifTags.DateTimeOriginal?.description ||
      exifTags.DateTime?.description;
    if (dateStr) {
      // EXIF date format: "2026:04:08 12:30:00" → "2026-04-08"
      const match = dateStr.match(/^(\d{4})[:\-/](\d{2})[:\-/](\d{2})/);
      if (match) exif.takenAt = `${match[1]}-${match[2]}-${match[3]}`;
    }

    // GPS Location
    const lat = gps.Latitude;
    const lon = gps.Longitude;
    if (lat != null && lon != null) {
      exif.location = `${Number(lat).toFixed(4)}, ${Number(lon).toFixed(4)}`;
    }

    return exif;
  } catch {
    return {};
  }
}

const THUMB_MAX_WIDTH = 800;
const THUMB_QUALITY = 0.85;

function generateThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, THUMB_MAX_WIDTH / img.naturalWidth);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error("Failed to generate thumbnail"));
        },
        "image/jpeg",
        THUMB_QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for thumbnail"));
    };
    img.src = url;
  });
}

function uploadToOSS(
  signedUrl: string,
  file: File,
  contentType: string,
  onProgress: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export default function ImageUploader({ onUpload }: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setError("Please select an image file.");
        return;
      }

      setError("");
      setProgress(0);

      try {
        setState("reading");
        const [dims, exif] = await Promise.all([
          readImageDimensions(file),
          readExif(file),
        ]);
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        setState("signing");
        const presignRes = await fetch("/api/upload/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, contentType: file.type }),
        });

        if (!presignRes.ok) {
          const data = await presignRes.json();
          throw new Error(data.error || "Failed to get upload URL");
        }

        const { signedUrl, publicUrl, thumbSignedUrl, thumbPublicUrl } =
          await presignRes.json();

        setState("uploading");
        const thumbBlob = await generateThumbnail(file);

        await Promise.all([
          uploadToOSS(signedUrl, file, file.type, setProgress),
          uploadToOSS(thumbSignedUrl, new File([thumbBlob], "thumb.jpg", { type: "image/jpeg" }), "image/jpeg", () => {}),
        ]);

        setState("done");
        onUpload({
          src: publicUrl,
          thumbnail: thumbPublicUrl,
          width: dims.width,
          height: dims.height,
          exif,
        });
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [onUpload],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  const reset = () => {
    setState("idle");
    setProgress(0);
    setError("");
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const statusLabel =
    state === "reading"
      ? "Reading image & EXIF..."
      : state === "signing"
        ? "Preparing upload..."
        : state === "uploading"
          ? `Uploading ${progress}%`
          : state === "done"
            ? "Upload complete"
            : null;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => state !== "uploading" && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-4 py-10 transition-colors cursor-pointer ${
          dragOver
            ? "border-white/50 bg-white/10"
            : state === "done"
              ? "border-green-500/40 bg-green-500/5"
              : state === "error"
                ? "border-red-500/40 bg-red-500/5"
                : "border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.07]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />

        {preview && (state === "uploading" || state === "done") ? (
          <div className="w-full max-h-48 rounded overflow-hidden bg-black/20 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="max-h-48 object-contain"
            />
          </div>
        ) : (
          <svg
            className="h-10 w-10 text-neutral-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
            />
          </svg>
        )}

        {statusLabel ? (
          <p className="text-sm text-neutral-300">{statusLabel}</p>
        ) : (
          <div className="text-center">
            <p className="text-sm text-neutral-300">
              Drag & drop an image here, or click to browse
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              JPG, PNG, WebP supported &middot; EXIF auto-read
            </p>
          </div>
        )}

        {state === "uploading" && (
          <div className="w-full max-w-xs h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {(state === "done" || state === "error") && (
        <button
          type="button"
          onClick={reset}
          className="text-xs text-neutral-400 hover:text-white transition-colors underline underline-offset-2"
        >
          {state === "done" ? "Upload another" : "Try again"}
        </button>
      )}
    </div>
  );
}
