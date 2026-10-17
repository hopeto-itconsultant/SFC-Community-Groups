"use client";

import { useState } from "react";
import { HALF_HOUR_TIMES, formatTime, isHalfHourTime } from "@/lib/format";
import { dateTimeControlClass } from "./form";

const OTHER = "__other__";

/**
 * Time control that lists only :00 / :30. Choose "Other…" for any minute.
 * Server still accepts any HH:MM — this only shapes the picker.
 */
export function HalfHourTimeInput({
  name,
  value,
  onChange,
  "aria-label": ariaLabel,
  required,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  "aria-label": string;
  required?: boolean;
}) {
  const [other, setOther] = useState(() => Boolean(value) && !isHalfHourTime(value));

  if (other) {
    return (
      <div className="flex min-w-0 flex-col gap-1">
        <input
          name={name}
          type="time"
          required={required}
          aria-label={ariaLabel}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={dateTimeControlClass}
        />
        <button
          type="button"
          className="self-end text-xs font-semibold text-brand-700"
          onClick={() => {
            setOther(false);
            if (value && !isHalfHourTime(value)) onChange("");
          }}
        >
          Half hours
        </button>
      </div>
    );
  }

  const selectValue = value && isHalfHourTime(value) ? value : "";

  return (
    <select
      name={name}
      required={required}
      aria-label={ariaLabel}
      value={selectValue}
      onChange={(e) => {
        const next = e.target.value;
        if (next === OTHER) {
          setOther(true);
          onChange("");
          return;
        }
        onChange(next);
      }}
      className={dateTimeControlClass}
    >
      <option value="" disabled>
        Time
      </option>
      {HALF_HOUR_TIMES.map((t) => (
        <option key={t} value={t}>
          {formatTime(t)}
        </option>
      ))}
      <option value={OTHER}>Other…</option>
    </select>
  );
}
