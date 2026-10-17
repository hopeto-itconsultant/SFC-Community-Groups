"use client";

import Image from "next/image";
import { useState } from "react";
import { photoVariant } from "@/lib/photos";
import { PhotoViewer } from "./PhotoViewer";

/** Large group profile photo that opens in the in-app viewer on tap. */
export function GroupHeroPhoto({ src, name }: { src: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* A button whose only child is an absolutely positioned image collapses to
          height 0, so the aspect ratio has to live on this div. */}
      <div className="relative -mx-4 -mt-4 mb-4 aspect-[16/9] w-[calc(100%+2rem)] bg-slate-100">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="absolute inset-0 text-left"
          aria-label={`View ${name} photo`}
        >
          <Image
            src={photoVariant(src, 384)}
            alt={`${name} fellowship`}
            fill
            sizes="(max-width: 576px) 100vw, 576px"
            className="object-cover"
            priority
            unoptimized
          />
        </button>
      </div>
      {open && (
        <PhotoViewer
          photos={[src]}
          index={0}
          onClose={() => setOpen(false)}
          alt={`${name} fellowship`}
        />
      )}
    </>
  );
}
