"use client";

import { useDisplayName } from "@/lib/session";

/** A person's name, with titles hidden when this screen's setting says so. */
export function ShownName({ name, className }: { name: string; className?: string }) {
  const shown = useDisplayName();
  return <span className={className}>{shown(name)}</span>;
}
