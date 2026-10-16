import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";

const IMAGE_ROOT = path.join(process.cwd(), "docs", "guide", "images");

/** Serves a guide screenshot to a signed-in person. */
export async function GET(_request: Request, ctx: RouteContext<"/guide/images/[...path]">) {
  await requireUser();
  const { path: segments } = await ctx.params;
  const file = path.resolve(IMAGE_ROOT, ...segments);
  const relative = path.relative(IMAGE_ROOT, file);
  if (relative.startsWith("..") || path.isAbsolute(relative) || !file.endsWith(".png")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await readFile(file);
    return new Response(new Uint8Array(bytes), {
      headers: { "Content-Type": "image/png", "Cache-Control": "private, max-age=3600" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
