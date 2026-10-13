// Browser-only: shrinks phone photos before upload so a report with three
// photos stays well under the upload limit and loads quickly on mobile data.

const MAX_EDGE = 1600;
const QUALITY = 0.8;

function isHeic(file: File): boolean {
  return /image\/hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || isHeic(file);
}

/** A JPEG no larger than MAX_EDGE on its longest side. */
export async function compressImage(file: File): Promise<File> {
  let source: Blob = file;
  if (isHeic(file)) {
    // Most browsers other than Safari can't decode HEIC (iPhone) photos.
    const { default: heic2any } = await import("heic2any");
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: QUALITY });
    source = Array.isArray(converted) ? converted[0] : converted;
  }

  const bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALITY));
  if (!blob) throw new Error("Could not prepare the photo.");
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "") || "photo"}.jpg`, { type: "image/jpeg" });
}
