"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { compressImage, isImageFile } from "@/lib/compress-image";
import { MAX_PHOTOS, photoVariant, storagePath } from "@/lib/photos";
import { CameraIcon, XIcon } from "./icons";

/** A photo already saved on a report, or one just picked on this device. */
export interface PhotoItem {
  id: string;
  /** Set for a photo picked on this device. */
  file?: File;
  previewUrl: string;
  /** Storage path when this photo is already saved. */
  storedPath?: string;
}

let nextId = 0;

function toPhotoItem(file: File): PhotoItem {
  nextId += 1;
  return { id: `photo-${Date.now()}-${nextId}`, file, previewUrl: URL.createObjectURL(file) };
}

/** Saved report photos, ready to show beside any new ones the person adds. */
export function storedPhotoItems(urls: string[]): PhotoItem[] {
  return urls.flatMap((url) => {
    const storedPath = storagePath("report-photos", url);
    if (!storedPath) return [];
    return [{ id: storedPath, previewUrl: photoVariant(url, 384), storedPath }];
  });
}

/** Holds selected photos and releases device preview URLs when no longer needed. */
export function usePhotoItems(initial: PhotoItem[] = []) {
  const [photos, setPhotos] = useState<PhotoItem[]>(initial);
  const latest = useRef(photos);

  useEffect(() => {
    latest.current = photos;
  }, [photos]);

  useEffect(
    () => () =>
      latest.current.forEach((p) => {
        if (p.file) URL.revokeObjectURL(p.previewUrl);
      }),
    [],
  );

  return { photos, setPhotos };
}

/** Adds newly picked photos to form data being sent to a Server Action. */
export function appendPhotos(formData: FormData, field: string, photos: PhotoItem[]): FormData {
  for (const p of photos) {
    if (p.file) formData.append(field, p.file);
  }
  return formData;
}

/** Adds the storage paths of saved photos the person kept. */
export function appendKeptPhotos(formData: FormData, photos: PhotoItem[]): FormData {
  for (const p of photos) {
    if (p.storedPath) formData.append("keptPhotos", p.storedPath);
  }
  return formData;
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
  const [preparing, setPreparing] = useState(false);
  const remaining = max - value.length;

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).filter(isImageFile);
    e.target.value = "";
    if (!files.length) return;
    const accepted = files.slice(0, remaining);
    const skipped = files.length - accepted.length;

    setPreparing(true);
    const results = await Promise.allSettled(accepted.map(compressImage));
    setPreparing(false);

    const ready = results.flatMap((r) => (r.status === "fulfilled" ? [toPhotoItem(r.value)] : []));
    const failed = results.length - ready.length;
    const messages = [
      skipped > 0 &&
        `Maximum ${max} photo${max === 1 ? "" : "s"}. ${skipped} photo${skipped === 1 ? " was" : "s were"} not added.`,
      failed > 0 && `${failed} photo${failed === 1 ? "" : "s"} could not be read. Try a JPG or PNG.`,
    ].filter(Boolean);
    setNotice(messages.length ? messages.join(" ") : null);
    onChange([...value, ...ready]);
  }

  function remove(id: string) {
    const item = value.find((p) => p.id === id);
    if (item?.file) URL.revokeObjectURL(item.previewUrl);
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
            disabled={preparing}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/50 text-sm font-semibold text-brand-700 active:bg-brand-50 disabled:opacity-60"
          >
            <CameraIcon />
            {preparing ? "Preparing…" : "Add photo"}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        multiple={max > 1}
        onChange={handleFiles}
        className="hidden"
      />
      <p className="mt-2 text-xs text-slate-500">
        {value.length} of {max} photo{max === 1 ? "" : "s"}.
      </p>
      {notice && (
        <p role="status" className="mt-1 text-sm font-medium text-amber-700">
          {notice}
        </p>
      )}
    </div>
  );
}
