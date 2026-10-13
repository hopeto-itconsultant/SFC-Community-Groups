"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { CameraIcon, XIcon } from "./icons";

export const MAX_PHOTOS = 3;

/**
 * A photo selected on the device. Camera photos are downscaled before preview.
 * In production `file` would be uploaded to Supabase Storage on submit; the UI
 * only depends on `previewUrl`.
 */
export interface PhotoItem {
  id: string;
  file: File;
  previewUrl: string;
}

let nextId = 0;

const MAX_EDGE = 1600;
const MAX_BYTES = 450 * 1024;

/** Downscale camera photos before preview so a phone doesn't decode a multi-megabyte image. */
async function compressPhoto(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  if (typeof createImageBitmap !== "function") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const longest = Math.max(bitmap.width, bitmap.height);
    if (file.size <= MAX_BYTES && longest <= MAX_EDGE) {
      bitmap.close();
      return file;
    }
    const scale = Math.min(1, MAX_EDGE / longest);
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.\w+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}

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

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter((f) => f.type.startsWith("image/"));
    e.target.value = "";
    if (!files.length) return;
    const accepted = files.slice(0, remaining);
    const skipped = files.length - accepted.length;
    setNotice(
      skipped > 0
        ? `Maximum ${max} photo${max === 1 ? "" : "s"}. ${skipped} photo${skipped === 1 ? " was" : "s were"} not added.`
        : null,
    );
    const compressed = await Promise.all(accepted.map(compressPhoto));
    onChange([...value, ...compressed.map(toPhotoItem)]);
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
        {value.length} of {max} photo{max === 1 ? "" : "s"}. Prototype: photos stay on this device and are not uploaded.
      </p>
      {notice && (
        <p role="status" className="mt-1 text-sm font-medium text-amber-700">
          {notice}
        </p>
      )}
    </div>
  );
}
