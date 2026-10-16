"use client";

import Image from "next/image";
import { useState } from "react";
import { photoVariant } from "@/lib/photos";
import { PhotoViewer } from "./PhotoViewer";

/** Thumbnail grid that opens photos in the in-app full-screen viewer. */
export function PhotoGrid({ photos }: { photos: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!photos.length) return <span className="text-slate-400">No photos</span>;

  return (
    <>
      <div className="mt-1 grid grid-cols-3 gap-2">
        {photos.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative block aspect-square overflow-hidden rounded-xl bg-slate-100"
            aria-label={`View photo ${i + 1}`}
          >
            <Image
              src={photoVariant(src, 384)}
              alt={`Photo ${i + 1}`}
              fill
              sizes="33vw"
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>
      {openIndex !== null && (
        <PhotoViewer photos={photos} index={openIndex} onClose={() => setOpenIndex(null)} />
      )}
    </>
  );
}
