import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";

const GUIDES = {
  admin: "SFC CGs Admin Guide.pdf",
  leader: "SFC CG Leader Guide.pdf",
} as const;

/** Opens the signed-in person's guide. Admins get the admin PDF; everyone else gets the leader PDF. */
export async function GET() {
  const user = await requireUser();
  const file = user.role === "admin" ? GUIDES.admin : GUIDES.leader;
  const bytes = await readFile(path.join(process.cwd(), "docs", file));

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${file}"; filename*=UTF-8''${encodeURIComponent(file)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
