"use client";

import { Photo } from "@/lib/types";
import PhotoCard from "./PhotoCard";

interface PhotoGridProps {
  photos: Photo[];
  onPhotoClick: (index: number) => void;
}

export default function PhotoGrid({ photos, onPhotoClick }: PhotoGridProps) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {photos.map((photo, index) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onClick={() => onPhotoClick(index)}
        />
      ))}
    </div>
  );
}
