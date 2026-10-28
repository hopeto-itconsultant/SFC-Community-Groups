"use client";

import { useEffect, useState } from "react";
import { isConstrainedNetwork } from "@/lib/network";

/** Prefetch nav targets on fine pointers (mouse). Skip phones and slow networks. */
export function useNavPrefetch() {
  const [prefetch, setPrefetch] = useState(false);

  useEffect(() => {
    if (isConstrainedNetwork()) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const id = window.setTimeout(() => setPrefetch(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  return prefetch;
}
