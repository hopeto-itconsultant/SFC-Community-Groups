import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MAX_PHOTO_BYTES, PHOTO_TYPES, type PhotoBucket } from "./photos";

/** The photos sent with a form under `field`, or an error message. */
export function photoFiles(formData: FormData, field: string, max: number): File[] | string {
  const files = formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > max) return `You can add at most ${max} photo${max === 1 ? "" : "s"}.`;
  for (const file of files) {
    if (!PHOTO_TYPES[file.type]) return "Photos must be JPG, PNG or WebP images.";
    if (file.size > MAX_PHOTO_BYTES) return "Each photo must be smaller than 5 MB.";
  }
  return files;
}

/**
 * Uploads to `<groupId>/<name>-<n>.<ext>` and returns the storage paths. On
 * failure, anything already uploaded is removed again.
 */
export async function uploadPhotos(
  supabase: SupabaseClient,
  bucket: PhotoBucket,
  groupId: string,
  name: string,
  files: File[],
): Promise<string[] | { error: string }> {
  const paths: string[] = [];
  for (const [i, file] of files.entries()) {
    const path = `${groupId}/${name}-${i + 1}.${PHOTO_TYPES[file.type]}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type });
    if (error) {
      await removePhotos(supabase, bucket, paths);
      return { error: `Could not upload the photo: ${error.message}` };
    }
    paths.push(path);
  }
  return paths;
}

export async function removePhotos(supabase: SupabaseClient, bucket: PhotoBucket, paths: string[]): Promise<void> {
  if (paths.length) await supabase.storage.from(bucket).remove(paths);
}
