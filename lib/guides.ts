import path from "node:path";

const PDFS = {
  admin: "SFC CGs Admin Guide.pdf",
  leader: "SFC CG Leader Guide.pdf",
} as const;

/** Admin gets the admin guide. Leaders and assistant leaders get the leader guide. */
export function guideKind(role: string): keyof typeof PDFS {
  return role === "admin" ? "admin" : "leader";
}

export function guidePdfPath(role: string) {
  return path.join(process.cwd(), "docs", PDFS[guideKind(role)]);
}

export function guidePdfName(role: string) {
  return PDFS[guideKind(role)];
}

export function guideHtmlPath(role: string) {
  return path.join(process.cwd(), "docs", "guide", `${guideKind(role)}.html`);
}
