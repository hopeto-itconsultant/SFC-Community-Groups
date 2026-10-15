// Photos live in private Supabase Storage buckets. Screens show them through
// app/photos, which checks access with the viewer's session. Paths start with
// the group id (see supabase/migrations/*_storage.sql).

export const PHOTO_BUCKETS = ["group-photos", "report-photos"] as const;
export type PhotoBucket = (typeof PHOTO_BUCKETS)[number];

/** Photos per fellowship report; also enforced by the database. */
export const MAX_PHOTOS = 3;

/** Same limit as the buckets' file_size_limit. */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function photoUrl(bucket: PhotoBucket, path: string): string {
  return `/photos/${bucket}/${path}`;
}

/** Storage path for an app photo URL, or undefined when it is not from this bucket. */
export function storagePath(bucket: PhotoBucket, url: string): string | undefined {
  const prefix = `/photos/${bucket}/`;
  if (!url.startsWith(prefix)) return undefined;
  const path = url.slice(prefix.length);
  if (!path || path.startsWith("/") || path.includes("..")) return undefined;
  return path;
}

/** Shortest-edge sizes app/photos can scale to, so lists don't download full-size photos. */
export const PHOTO_VARIANTS = [192, 384] as const;
export type PhotoVariant = (typeof PHOTO_VARIANTS)[number];

/** A smaller copy of a stored photo. Other sources, such as local previews, are returned unchanged. */
export function photoVariant(src: string, size: PhotoVariant): string {
  return src.startsWith("/photos/") ? `${src}?w=${size}` : src;
}
