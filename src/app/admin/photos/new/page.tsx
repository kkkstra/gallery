"use client";

import { useState } from "react";
import PhotoForm from "@/components/PhotoForm";
import BatchUploader from "@/components/BatchUploader";

export default function NewPhotoPage() {
  const [mode, setMode] = useState<"single" | "batch">("single");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-light tracking-wider text-white">
          Add Photo
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Add a new photo to your gallery
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
            mode === "single"
              ? "bg-white text-black"
              : "border border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
          }`}
        >
          Single Photo
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${
            mode === "batch"
              ? "bg-white text-black"
              : "border border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
          }`}
        >
          Batch Upload
        </button>
      </div>

      {mode === "single" ? <PhotoForm /> : <BatchUploader />}
    </div>
  );
}
