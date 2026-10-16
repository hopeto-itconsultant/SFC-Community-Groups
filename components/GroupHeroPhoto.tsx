"use client";

import Image from "next/image";
import { useState } from "react";
import { PhotoViewer } from "./PhotoViewer";

/** Large group profile photo that opens in the in-app viewer on tap. */
export function GroupHeroPhoto({ src, name }: { src: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative -mx-4 -mt-4 mb-4 block aspect-[16/9] w-[calc(100%+2rem)] max-w-none bg-slate-100 text-left"
        aria-label={`View ${name} photo`}
      >
        <Image
          src={src}
          alt={`${name} fellowship`}
          fill
          sizes="(max-width: 576px) 100vw, 576px"
          className="object-cover"
          priority
          unoptimized
        />
      </button>
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
