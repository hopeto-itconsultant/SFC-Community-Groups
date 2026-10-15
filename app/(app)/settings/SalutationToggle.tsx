"use client";

import { useState, useTransition } from "react";
import { setShowSalutations } from "@/lib/actions/auth";

/** Saves on tap; applies only to the signed-in person's own screens. */
export function SalutationToggle({ initial }: { initial: boolean }) {
  const [checked, setChecked] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startSave] = useTransition();

  function change(show: boolean) {
    setChecked(show);
    setError(null);
    startSave(async () => {
      const result = await setShowSalutations(show);
      if (result.error) {
        setChecked(!show);
        setError(result.error);
      }
    });
  }

  return (
    <div className="border-t border-slate-100 pt-1">
      <label className="flex min-h-12 items-center gap-3 text-sm font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          disabled={pending}
          onChange={(e) => change(e.target.checked)}
          className="size-5 shrink-0 accent-brand-700"
        />
        <span>
          Show titles before names <span className="text-xs font-normal text-slate-500">Bro., Sis., Dr.</span>
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
