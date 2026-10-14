import type { NextRequest } from "next/server";
import sharp from "sharp";
import { PHOTO_BUCKETS, PHOTO_VARIANTS, type PhotoBucket, type PhotoVariant } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

// File names are unique and never overwritten, so the browser may keep them.
const CACHE_CONTROL = "private, max-age=604800, immutable";

function isBucket(value: string): value is PhotoBucket {
  return (PHOTO_BUCKETS as readonly string[]).includes(value);
}

function isVariant(value: number): value is PhotoVariant {
  return (PHOTO_VARIANTS as readonly number[]).includes(value);
}

/**
 * Streams a private photo if the signed-in user may see it (Storage access rules decide).
 * `?w=` with one of PHOTO_VARIANTS returns a WebP scaled so its shortest edge is that size.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/photos/[bucket]/[...path]">) {
  const { bucket, path } = await ctx.params;
  if (!isBucket(bucket)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).download(path.join("/"));
  if (error || !data) return new Response("Not found", { status: 404 });

  const size = Number(request.nextUrl.searchParams.get("w"));
  if (isVariant(size)) {
    try {
      const scaled = await sharp(await data.arrayBuffer())
        .rotate()
        .resize(size, size, { fit: "outside", withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer();
      return new Response(new Uint8Array(scaled), {
        headers: { "Content-Type": "image/webp", "Cache-Control": CACHE_CONTROL },
      });
    } catch {
      // Fall back to the original if the file can't be decoded.
    }
  }

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      "Cache-Control": CACHE_CONTROL,
    },
  });
}
