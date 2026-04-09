"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Photo } from "@/lib/types";
import { useLocale } from "./LocaleProvider";
import type { LayoutMode } from "./PhotoGrid";

interface PhotoCardProps {
  photo: Photo;
  layout?: LayoutMode;
  onClick: () => void;
}

export default function PhotoCard({ photo, layout = "grid", onClick }: PhotoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [loaded, setLoaded] = useState(false);
  const { localized } = useLocale();

  const title = localized(photo.title, photo.titleZh);
  const desc = localized(photo.description, photo.descriptionZh);

  if (layout === "feed") {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="cursor-pointer"
        onClick={onClick}
      >
        <div className="relative overflow-hidden rounded-lg">
          <div
            style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}
            className={`w-full ${loaded ? "" : "animate-pulse bg-[var(--surface)]"}`}
          />
          <Image
            src={photo.thumbnail || photo.src}
            alt={title}
            width={photo.width}
            height={photo.height}
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}
            sizes="(max-width: 672px) 100vw, 672px"
          />
        </div>
        <div className="mt-3 px-1">
          <h3 className="text-lg font-light tracking-wider text-[var(--text)]">
            {title}
          </h3>
          {desc && (
            <p className="mt-1.5 text-sm text-[var(--text-muted)] leading-relaxed">
              {desc}
            </p>
          )}
          {(photo.camera || photo.takenAt || photo.location) && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[var(--text-faint)]">
              {photo.camera && <span>{photo.camera}</span>}
              {photo.location && <span>{photo.location}</span>}
              {photo.takenAt && <span>{photo.takenAt}</span>}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (layout === "square") {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="cursor-pointer group relative aspect-square overflow-hidden"
        onClick={onClick}
      >
        {!loaded && <div className="absolute inset-0 animate-pulse bg-[var(--surface)]" />}
        <Image
          src={photo.thumbnail || photo.src}
          alt={title}
          width={photo.width}
          height={photo.height}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <h3 className="text-sm font-light tracking-wider text-white line-clamp-2">
            {title}
          </h3>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <div
          style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}
          className={`w-full ${loaded ? "" : "animate-pulse bg-[var(--surface)]"}`}
        />
        <Image
          src={photo.thumbnail || photo.src}
          alt={title}
          width={photo.width}
          height={photo.height}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <h3 className="text-base font-light tracking-wider text-white">
            {title}
          </h3>
          {desc && (
            <p className="mt-1 text-xs text-white/70 line-clamp-2">{desc}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
