"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PhotoForm from "@/components/PhotoForm";

export default function EditPhotoPage() {
  const params = useParams();
  const [photo, setPhoto] = useState<{
    id: number;
    src: string;
    thumbnail: string;
    title: string;
    description: string;
    categorySlug: string;
    width: number;
    height: number;
    featured: boolean;
    sortOrder: number;
    cameraId: number | null;
    lensId: number | null;
    aperture: string;
    shutterSpeed: string;
    iso: string;
    focalLength: string;
    takenAt: string;
    location: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/photos/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        setPhoto({
          id: data.id,
          src: data.src,
          thumbnail: data.thumbnail || "",
          title: data.title,
          description: data.description || "",
          categorySlug: data.categorySlug,
          width: data.width,
          height: data.height,
          featured: !!data.featured,
          sortOrder: data.sortOrder || 0,
          cameraId: data.cameraId || null,
          lensId: data.lensId || null,
          aperture: data.aperture || "",
          shutterSpeed: data.shutterSpeed || "",
          iso: data.iso || "",
          focalLength: data.focalLength || "",
          takenAt: data.takenAt || "",
          location: data.location || "",
        });
        setLoading(false);
      });
  }, [params.id]);

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
        <h1 className="text-2xl font-light tracking-wider text-white">Edit Photo</h1>
        <p className="mt-1 text-sm text-neutral-500">Update photo details</p>
      </div>
      {photo && <PhotoForm initialData={photo} />}
    </div>
  );
}
