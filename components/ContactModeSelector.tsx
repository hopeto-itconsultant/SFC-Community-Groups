"use client";

import type { ContactMode } from "@/data/types";
import { CONTACT_MODES } from "@/lib/format";

export function ContactModeSelector({
  value,
  onChange,
}: {
  value: ContactMode | null;
  onChange: (mode: ContactMode) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Mode of Contact" className="grid grid-cols-3 gap-2">
      {CONTACT_MODES.map((m) => {
        const selected = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(m.value)}
            className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border-2 text-sm font-semibold transition active:scale-[0.97] ${
              selected
                ? "border-brand-600 bg-brand-50 text-brand-800"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            <span className="text-2xl" aria-hidden="true">
              {m.emoji}
            </span>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
