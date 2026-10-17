import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";

const PDF_NAME = "SFC Community Groups - Whats new.pdf";

/** Sends What’s new as a PDF download for signed-in users. */
export async function GET() {
  await requireUser();
  const bytes = await readFile(path.join(process.cwd(), "docs", "updates.pdf"));

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${PDF_NAME}"; filename*=UTF-8''${encodeURIComponent(PDF_NAME)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
