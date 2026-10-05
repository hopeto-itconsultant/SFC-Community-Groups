"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraIcon, XIcon } from "./icons";

export const MAX_PHOTOS = 5;

/**
 * A photo selected on the device. In production `file` would be compressed
 * (~300-500 KB) and uploaded to Supabase Storage on submit; the UI only
 * depends on `previewUrl`.
 */
export interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
}

let nextId = 0;

function toPhotoItem(file: File): PhotoItem {
  nextId += 1;
  return { id: `photo-${Date.now()}-${nextId}`, file, previewUrl: URL.createObjectURL(file) };
}

/** Holds selected photos and releases their preview URLs when no longer needed. */
export function usePhotoItems() {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const latest = useRef(photos);

  useEffect(() => {
    latest.current = photos;
  }, [photos]);

  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), []);

  const clear = useCallback(() => {
    latest.current.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
  }, []);

  return { photos, setPhotos, clear };
}

export function PhotoPicker({
  value,
  onChange,
  max = MAX_PHOTOS,
}: {
  value: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const remaining = max - value.length;

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) return;
    const accepted = files.slice(0, remaining);
    const skipped = files.length - accepted.length;
    setNotice(
      skipped > 0
        ? `Maximum ${max} photos per report. ${skipped} photo${skipped === 1 ? " was" : "s were"} not added.`
        : null,
    );
    onChange([...value, ...accepted.map(toPhotoItem)]);
  }

  function remove(id: string) {
    const item = value.find((p) => p.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onChange(value.filter((p) => p.id !== id));
    setNotice(null);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {value.map((p, i) => (
          <div key={p.id} className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            <Image
              src={p.previewUrl}
              alt={`Selected photo ${i + 1}`}
              fill
              sizes="33vw"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={() => remove(p.id)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white active:bg-black/80"
            >
              <XIcon width={18} height={18} />
            </button>
          </div>
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-sm font-semibold text-brand-700 active:bg-brand-50"
          >
            <CameraIcon />
            Add photo
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
        className="hidden"
      />
      <p className="mt-2 text-xs text-slate-500">
        {value.length} of {max} photos. Prototype: photos stay on this device and are not uploaded.
      </p>
      {notice && (
        <p role="status" className="mt-1 text-sm font-medium text-amber-700">
          {notice}
        </p>
      )}
    </div>
  );
}
