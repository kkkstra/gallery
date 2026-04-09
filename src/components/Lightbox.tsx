"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Photo } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

const DESC_TRUNCATE = 120;
const MIN_SCALE = 1;
const MAX_SCALE = 5;
const ZOOM_STEP = 0.5;

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

function getTouchDistance(touches: React.TouchList | TouchList) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

export default function Lightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: LightboxProps) {
  const { t, localized } = useLocale();
  const photo = photos[currentIndex];
  const photoTitle = localized(photo.title, photo.titleZh);
  const photoDesc = localized(photo.description, photo.descriptionZh);
  const [direction, setDirection] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const mousePanRef = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const lastTap = useRef(0);

  const isZoomed = scale > 1.05;

  const resetZoom = useCallback(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, []);

  const descTruncated = useMemo(() => {
    if (!photoDesc || photoDesc.length <= DESC_TRUNCATE) return null;
    return photoDesc.slice(0, DESC_TRUNCATE).trimEnd() + "...";
  }, [photoDesc]);

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setDirection(1);
      setDescExpanded(false);
      resetZoom();
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate, resetZoom]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setDescExpanded(false);
      resetZoom();
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate, resetZoom]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isZoomed) resetZoom();
        else onClose();
      }
      if (e.key === "ArrowRight" && !isZoomed) goNext();
      if (e.key === "ArrowLeft" && !isZoomed) goPrev();
      if (e.key === "i") setShowDetails((v) => !v);
      if (e.key === "=" || e.key === "+") {
        setScale((s) => Math.min(MAX_SCALE, s + ZOOM_STEP));
      }
      if (e.key === "-") {
        setScale((s) => {
          const next = Math.max(MIN_SCALE, s - ZOOM_STEP);
          if (next <= 1.05) setTranslate({ x: 0, y: 0 });
          return next;
        });
      }
      if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goNext, goPrev, isZoomed, resetZoom]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    setScale((s) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s - e.deltaY * 0.002));
      if (next <= 1.05) setTranslate({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isZoomed) return;
    e.preventDefault();
    setIsDragging(true);
    mousePanRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y };
  }, [isZoomed, translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!mousePanRef.current || !isDragging) return;
    const dx = e.clientX - mousePanRef.current.x;
    const dy = e.clientY - mousePanRef.current.y;
    setTranslate({ x: mousePanRef.current.tx + dx, y: mousePanRef.current.ty + dy });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    mousePanRef.current = null;
    setIsDragging(false);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: getTouchDistance(e.touches), scale };
      panRef.current = null;
      touchStart.current = null;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (isZoomed) resetZoom();
        else {
          setScale(2.5);
        }
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;

      if (isZoomed) {
        panRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          tx: translate.x,
          ty: translate.y,
        };
        touchStart.current = null;
      } else {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        panRef.current = null;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const dist = getTouchDistance(e.touches);
      const ratio = dist / pinchRef.current.dist;
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinchRef.current.scale * ratio));
      setScale(next);
      if (next <= 1.05) setTranslate({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && panRef.current && isZoomed) {
      const dx = e.touches[0].clientX - panRef.current.x;
      const dy = e.touches[0].clientY - panRef.current.y;
      setTranslate({ x: panRef.current.tx + dx, y: panRef.current.ty + dy });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (pinchRef.current) {
      pinchRef.current = null;
      return;
    }
    if (panRef.current) {
      panRef.current = null;
      return;
    }
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
      onClick={isZoomed ? undefined : onClose}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button
        className="absolute top-5 right-5 z-10 p-2 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
        aria-label={t("lightbox.close")}
      >
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <button
        className={`absolute top-5 right-16 z-10 p-2 transition-colors ${
          showDetails ? "text-white" : "text-white/50 hover:text-white"
        }`}
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails((v) => !v);
        }}
        aria-label={t("lightbox.toggleDetails")}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
      </button>

      {isZoomed && (
        <button
          className="absolute top-5 right-[7.5rem] z-10 p-2 text-white/50 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); resetZoom(); }}
          aria-label={t("lightbox.resetZoom")}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        </button>
      )}

      {currentIndex > 0 && !isZoomed && (
        <button
          className="absolute left-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          aria-label={t("lightbox.prev")}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
      )}

      {currentIndex < photos.length - 1 && !isZoomed && (
        <button
          className="absolute right-4 z-10 p-2 text-white/50 hover:text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          aria-label={t("lightbox.next")}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      )}

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
          onWheel={handleWheel}
        >
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              transition: isDragging ? "none" : "transform 0.1s ease-out",
              cursor: isZoomed ? (isDragging ? "grabbing" : "grab") : "default",
            }}
          >
            <Image
              src={photo.src}
              alt={photoTitle}
              width={photo.width}
              height={photo.height}
              className="max-h-[85vh] w-auto object-contain select-none"
              sizes="90vw"
              priority
              draggable={false}
            />
          </div>
        </motion.div>
      </AnimatePresence>

      {isZoomed && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 px-3 py-1 rounded-full bg-black/60 text-white/70 text-xs">
          {Math.round(scale * 100)}%
        </div>
      )}

      <div
        className={`absolute bottom-0 left-0 right-0 pointer-events-none transition-opacity duration-200 ${isZoomed ? "opacity-0" : "opacity-100"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pb-6 pt-16 bg-gradient-to-t from-black/80 to-transparent pointer-events-auto">
          <div className="max-w-3xl mx-auto px-6 sm:px-10">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-light tracking-wider text-white">{photoTitle}</h3>
              <span className="text-xs text-white/40 shrink-0">
                {currentIndex + 1} / {photos.length}
              </span>
            </div>
            {photoDesc && (
              <div className="mt-1.5">
                <p className="text-sm text-white/60 leading-relaxed">
                  {descTruncated && !descExpanded ? descTruncated : photoDesc}
                </p>
                {descTruncated && (
                  <button
                    type="button"
                    className="text-xs text-white/40 hover:text-white/70 transition-colors mt-1"
                    onClick={(e) => { e.stopPropagation(); setDescExpanded((v) => !v); }}
                  >
                    {descExpanded ? t("lightbox.showLess") : t("lightbox.showMore")}
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
                    <DetailItem label={t("detail.category")} value={photo.category} />
                    <DetailItem label={t("detail.dimensions")} value={`${photo.width} × ${photo.height}`} />
                    <DetailItem label={t("detail.camera")} value={photo.camera} />
                    <DetailItem label={t("detail.lens")} value={photo.lens} />
                    <DetailItem label={t("detail.aperture")} value={photo.aperture} />
                    <DetailItem label={t("detail.shutter")} value={photo.shutterSpeed} />
                    <DetailItem label={t("detail.iso")} value={photo.iso} />
                    <DetailItem label={t("detail.focal")} value={photo.focalLength} />
                    <DetailItem label={t("detail.date")} value={photo.takenAt} />
                    <DetailItem label={t("detail.location")} value={photo.location} />
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
