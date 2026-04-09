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

export function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
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

export async function readExif(file: File): Promise<ExifData> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer, { expanded: true });
    const exif: ExifData = {};
    const exifTags = tags.exif || {};
    const gps = tags.gps || {};

    const make = exifTags.Make?.description?.trim();
    const model = exifTags.Model?.description?.trim();
    if (make && model) {
      exif.camera = model.startsWith(make) ? model : `${make} ${model}`;
    } else if (model) {
      exif.camera = model;
    }

    const lensModel = exifTags.LensModel?.description?.trim();
    if (lensModel) exif.lens = lensModel;

    const fNumber = exifTags.FNumber?.value;
    if (fNumber) {
      const f = Array.isArray(fNumber) ? fNumber[0] / fNumber[1] : Number(fNumber);
      if (f > 0) exif.aperture = `f/${f % 1 === 0 ? f : f.toFixed(1)}`;
    }

    const exposure = exifTags.ExposureTime?.value;
    if (exposure) {
      const val = Array.isArray(exposure) ? exposure[0] / exposure[1] : Number(exposure);
      if (val > 0) exif.shutterSpeed = formatShutterSpeed(val);
    }

    const iso = exifTags.ISOSpeedRatings?.value;
    if (iso != null) {
      exif.iso = String(Array.isArray(iso) ? iso[0] : iso);
    }

    const fl = exifTags.FocalLength?.value;
    if (fl) {
      const mm = Array.isArray(fl) ? fl[0] / fl[1] : Number(fl);
      if (mm > 0) exif.focalLength = `${Math.round(mm)}mm`;
    }

    const dateStr = exifTags.DateTimeOriginal?.description || exifTags.DateTime?.description;
    if (dateStr) {
      const match = dateStr.match(/^(\d{4})[:\-/](\d{2})[:\-/](\d{2})/);
      if (match) exif.takenAt = `${match[1]}-${match[2]}-${match[3]}`;
    }

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

export function generateThumbnail(file: File): Promise<Blob> {
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

export function uploadToOSS(
  signedUrl: string,
  file: File | Blob,
  contentType: string,
  onProgress?: (pct: number) => void,
  extraHeaders?: Record<string, string>,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);
    if (extraHeaders) {
      for (const [k, v] of Object.entries(extraHeaders)) {
        xhr.setRequestHeader(k, v);
      }
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}): ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export async function processAndUploadFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<UploadResult> {
  const [dims, exif] = await Promise.all([readImageDimensions(file), readExif(file)]);

  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!presignRes.ok) {
    const data = await presignRes.json();
    throw new Error(data.error || "Failed to get upload URL");
  }
  const { signedUrl, publicUrl, thumbSignedUrl, thumbPublicUrl } = await presignRes.json();

  const thumbBlob = await generateThumbnail(file);

  await Promise.all([
    uploadToOSS(signedUrl, file, file.type, onProgress),
    uploadToOSS(thumbSignedUrl, new File([thumbBlob], "thumb.jpg", { type: "image/jpeg" }), "image/jpeg"),
  ]);

  return { src: publicUrl, thumbnail: thumbPublicUrl, width: dims.width, height: dims.height, exif };
}
