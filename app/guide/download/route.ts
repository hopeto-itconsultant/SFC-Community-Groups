import { readFile } from "node:fs/promises";
import { requireUser } from "@/lib/auth";
import { guidePdfName, guidePdfPath } from "@/lib/guides";

/** Sends the signed-in person's guide as a file download. */
export async function GET() {
  const user = await requireUser();
  const file = guidePdfName(user.role);
  const bytes = await readFile(guidePdfPath(user.role));

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${file}"; filename*=UTF-8''${encodeURIComponent(file)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
