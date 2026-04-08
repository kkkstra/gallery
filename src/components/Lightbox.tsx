"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Photo } from "@/lib/types";

const DESC_TRUNCATE = 120;

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

function DetailItem({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase tracking-wider text-white/40">{label}</span>
      <span className="text-xs text-white/80">{value}</span>
    </div>
  );
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const photo = photos[currentIndex];
  const [direction, setDirection] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const descTruncated = useMemo(() => {
    if (!photo.description || photo.description.length <= DESC_TRUNCATE) return null;
    return photo.description.slice(0, DESC_TRUNCATE).trimEnd() + "...";
  }, [photo.description]);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setDirection(1);
      setDescExpanded(false);
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setDescExpanded(false);
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "i") setShowDetails((v) => !v);
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 60) {
      if (dx < 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        className="absolute top-5 right-5 z-10 p-2 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label="Close lightbox"
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Info toggle -- always visible */}
      <button
        className={`absolute top-5 right-16 z-10 p-2 transition-colors ${
          showDetails ? "text-white" : "text-white/50 hover:text-white"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails((v) => !v);
        }}
        aria-label="Toggle details"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </button>

      {/* Previous */}
      {currentIndex > 0 && (
        <button
          className="absolute left-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label="Previous photo"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Next */}
      {currentIndex < photos.length - 1 && (
        <button
          className="absolute right-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label="Next photo"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

      {/* Image */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={photo.id}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative flex max-h-[85vh] max-w-[90vw] items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={photo.src}
            alt={photo.title}
            width={photo.width}
            height={photo.height}
            className="max-h-[85vh] w-auto object-contain"
            sizes="90vw"
            priority
          />
        </motion.div>
      </AnimatePresence>

      {/* Caption + Details */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
          <div className="max-w-3xl mx-auto px-6 sm:px-10">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-light tracking-wider text-white">{photo.title}</h3>
              <span className="text-xs text-white/40 shrink-0">
                {currentIndex + 1} / {photos.length}
              </span>
            </div>
            {photo.description && (
              <div className="mt-1.5">
                <p className="text-sm text-white/60 leading-relaxed">
                  {descTruncated && !descExpanded ? descTruncated : photo.description}
                </p>
                {descTruncated && (
                  <button
                    type="button"
                    className="text-xs text-white/40 hover:text-white/70 transition-colors mt-1"
                    onClick={(e) => { e.stopPropagation(); setDescExpanded((v) => !v); }}
                  >
                    {descExpanded ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            )}

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-4">
                    <DetailItem label="Category" value={photo.category} />
                    <DetailItem label="Dimensions" value={`${photo.width} × ${photo.height}`} />
                    <DetailItem label="Camera" value={photo.camera} />
                    <DetailItem label="Lens" value={photo.lens} />
                    <DetailItem label="Aperture" value={photo.aperture} />
                    <DetailItem label="Shutter" value={photo.shutterSpeed} />
                    <DetailItem label="ISO" value={photo.iso} />
                    <DetailItem label="Focal" value={photo.focalLength} />
                    <DetailItem label="Date" value={photo.takenAt} />
                    <DetailItem label="Location" value={photo.location} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
