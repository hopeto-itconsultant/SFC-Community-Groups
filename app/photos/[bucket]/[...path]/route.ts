import type { NextRequest } from "next/server";
import { PHOTO_BUCKETS, type PhotoBucket } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";

function isBucket(value: string): value is PhotoBucket {
  return (PHOTO_BUCKETS as readonly string[]).includes(value);
}

/** Streams a private photo if the signed-in user may see it (Storage access rules decide). */
export async function GET(_request: NextRequest, ctx: RouteContext<"/photos/[bucket]/[...path]">) {
  const { bucket, path } = await ctx.params;
  if (!isBucket(bucket)) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(bucket).download(path.join("/"));
  if (error || !data) return new Response("Not found", { status: 404 });

  return new Response(data, {
    headers: {
      "Content-Type": data.type || "application/octet-stream",
      // File names are unique and never overwritten, so the browser may keep them.
      "Cache-Control": "private, max-age=604800, immutable",
    },
  });
}
