"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "./icons";

interface PhotoViewerProps {
  photos: string[];
  index: number;
  onClose: () => void;
  alt?: string;
}

/**
 * Full-screen in-app photo viewer. Keeps the PWA open (no new tab).
 * Shows the full-resolution URL with object-contain.
 * Portaled to document.body so overflow-hidden ancestors cannot clip it.
 */
export function PhotoViewer({ photos, index: startIndex, onClose, alt = "Photo" }: PhotoViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [mounted, setMounted] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const count = photos.length;
  const src = photos[index];

  onCloseRef.current = onClose;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    if (!mounted) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
      } else if (event.key === "ArrowLeft" && count > 1) {
        event.preventDefault();
        setIndex((current) => (current - 1 + count) % count);
      } else if (event.key === "ArrowRight" && count > 1) {
        event.preventDefault();
        setIndex((current) => (current + 1) % count);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, count]);

  function go(delta: number) {
    setIndex((current) => (current + delta + count) % count);
  }

  if (!src || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[100] flex flex-col bg-black"
    >
      <p id={titleId} className="sr-only">
        {count > 1 ? `${alt} ${index + 1} of ${count}` : alt}
      </p>

      <div className="flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2">
        <span className="min-w-0 text-sm font-medium text-white/80">
          {count > 1 ? `${index + 1} / ${count}` : ""}
        </span>
        <button
          ref={closeRef}
          type="button"
          onClick={() => onClose()}
          aria-label="Close photo"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/10"
        >
          <XIcon width={24} height={24} />
        </button>
      </div>

      <div className="relative min-h-0 flex-1" onClick={() => onClose()}>
        <Image
          src={src}
          alt={count > 1 ? `${alt} ${index + 1}` : alt}
          fill
          sizes="100vw"
          className="object-contain"
          unoptimized
          priority
          onClick={(event) => event.stopPropagation()}
        />

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={(event) => {
                event.stopPropagation();
                go(-1);
              }}
              className="absolute left-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronLeftIcon width={28} height={28} />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={(event) => {
                event.stopPropagation();
                go(1);
              }}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
            >
              <ChevronRightIcon width={28} height={28} />
            </button>
          </>
        )}
      </div>

      <div className="pb-[max(0.75rem,env(safe-area-inset-bottom))]" />
    </div>,
    document.body,
  );
}
