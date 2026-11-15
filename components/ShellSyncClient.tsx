"use client";

import { useEffect } from "react";
import type { ShellSnapshot } from "@/lib/shell";
import { useSetShell } from "@/lib/session";

export function ShellSyncClient({ shell }: { shell: ShellSnapshot }) {
  const setShell = useSetShell();
  useEffect(() => {
    setShell(shell);
  }, [setShell, shell]);
  return null;
}
