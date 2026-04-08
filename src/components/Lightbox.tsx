"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Photo } from "@/lib/types";

interface LightboxProps {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const photo = photos[currentIndex];
  const [direction, setDirection] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setDirection(1);
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
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

      {/* Previous button */}
      {currentIndex > 0 && (
        <button
          className="absolute left-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          aria-label="Previous photo"
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {/* Next button */}
      {currentIndex < photos.length - 1 && (
        <button
          className="absolute right-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
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

      {/* Caption */}
      <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none">
        <h3 className="text-lg font-light tracking-wider text-white">
          {photo.title}
        </h3>
        {photo.description && (
          <p className="mt-1 text-sm text-white/60">{photo.description}</p>
        )}
        <p className="mt-2 text-xs text-white/40">
          {currentIndex + 1} / {photos.length}
        </p>
      </div>
    </motion.div>
  );
}
