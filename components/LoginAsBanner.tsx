"use client";

import { useTransition } from "react";
import { returnToAdmin } from "@/lib/actions/auth";
import { useDisplayName } from "@/lib/session";

/** One-line bar while an Admin is viewing as a leader. */
export function LoginAsBanner({ name }: { name: string }) {
  const [pending, start] = useTransition();
  const shown = useDisplayName();

  return (
    <div className="sticky top-0 z-20 flex items-center gap-2 bg-amber-700 px-3 py-2 text-sm text-white">
      <p className="min-w-0 flex-1 truncate">
        Signed in as <span className="font-semibold">{shown(name)}</span>
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() => start(() => returnToAdmin())}
        className="shrink-0 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-semibold hover:bg-white/25 disabled:opacity-50"
      >
        {pending ? "…" : "Back to admin"}
      </button>
    </div>
  );
}
