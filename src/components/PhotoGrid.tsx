"use client";

import { useRef, useState, useEffect } from "react";
import { Photo } from "@/lib/types";
import PhotoCard from "./PhotoCard";

export type LayoutMode = "grid" | "square" | "feed";

interface PhotoGridProps {
  photos: Photo[];
  layout?: LayoutMode;
  onPhotoClick: (index: number) => void;
}

function getColCount(width: number): number {
  if (width >= 1280) return 4;
  if (width >= 1024) return 3;
  if (width >= 640) return 2;
  return 1;
}

export default function PhotoGrid({ photos, layout = "grid", onPhotoClick }: PhotoGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numCols, setNumCols] = useState(4);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setNumCols(getColCount(el.offsetWidth));
    const observer = new ResizeObserver((entries) => {
      setNumCols(getColCount(entries[0].contentRect.width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (layout === "feed") {
    return (
      <div className="mx-auto max-w-2xl flex flex-col gap-10">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            layout="feed"
            onClick={() => onPhotoClick(index)}
          />
        ))}
      </div>
    );
  }

  if (layout === "square") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1.5">
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            layout="square"
            onClick={() => onPhotoClick(index)}
          />
        ))}
      </div>
    );
  }

  // Row-first masonry: distribute photos across columns round-robin
  const columns: { photo: Photo; index: number }[][] = Array.from(
    { length: numCols },
    () => [],
  );
  photos.forEach((photo, i) => {
    columns[i % numCols].push({ photo, index: i });
  });

  return (
    <div ref={containerRef} className="flex gap-4">
      {columns.map((colItems, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-4">
          {colItems.map(({ photo, index }) => (
            <PhotoCard
              key={photo.id}
              photo={photo}
              layout="grid"
              onClick={() => onPhotoClick(index)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
