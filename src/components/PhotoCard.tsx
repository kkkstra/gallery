"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Photo } from "@/lib/types";

interface PhotoCardProps {
  photo: Photo;
  onClick: () => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [loaded, setLoaded] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mb-4 break-inside-avoid cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative overflow-hidden">
        <div
          style={{ paddingBottom: `${(photo.height / photo.width) * 100}%` }}
          className={`w-full ${loaded ? "" : "animate-pulse bg-[var(--surface)]"}`}
        />
        <Image
          src={photo.thumbnail || photo.src}
          alt={photo.title}
          width={photo.width}
          height={photo.height}
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-start justify-end p-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <h3 className="text-base font-light tracking-wider text-white">
            {photo.title}
          </h3>
          {photo.description && (
            <p className="mt-1 text-xs text-white/70 line-clamp-2">{photo.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
