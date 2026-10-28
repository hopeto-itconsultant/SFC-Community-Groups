"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { ReportType } from "@/data/types";
import { formatDate, parseLocalDate, todayISO, toISODate } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export type ReportDayMarker = {
  id: string;
  date: string;
  type: ReportType;
  groupName: string;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CHIP_CLASS: Record<ReportType, string> = {
  fellowship: "bg-brand-100 text-brand-800",
  "follow-up": "bg-sky-100 text-sky-800",
  "next-fellowship": "bg-emerald-100 text-emerald-800",
};

function monthStart(year: number, month: number) {
  return new Date(year, month, 1);
}

/** Current month when it has reports; otherwise the month of the newest report. */
function openingMonth(markers: ReportDayMarker[]): Date {
  const today = parseLocalDate(todayISO());
  const current = monthStart(today.getFullYear(), today.getMonth());
  const inCurrent = markers.some((marker) => {
    const date = parseLocalDate(marker.date);
    return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
  });
  if (inCurrent || markers.length === 0) return current;
  const newest = markers.reduce((best, marker) => (marker.date > best ? marker.date : best), markers[0].date);
  const parsed = parseLocalDate(newest);
  return monthStart(parsed.getFullYear(), parsed.getMonth());
}

function latestDayInMonth(
  byDate: Map<string, ReportDayMarker[]>,
  year: number,
  month: number,
): string | undefined {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  let latest: string | undefined;
  for (const iso of byDate.keys()) {
    if (iso.startsWith(prefix) && (!latest || iso > latest)) latest = iso;
  }
  return latest;
}

function monthCells(year: number, month: number): (string | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= days; day++) {
    cells.push(toISODate(new Date(year, month, day)));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function markersByDate(markers: ReportDayMarker[]): Map<string, ReportDayMarker[]> {
  const grouped = new Map<string, ReportDayMarker[]>();
  for (const marker of markers) {
    const day = grouped.get(marker.date);
    if (day) day.push(marker);
    else grouped.set(marker.date, [marker]);
  }
  return grouped;
}

function DayChips({ markers }: { markers: ReportDayMarker[] }) {
  const shown = markers.slice(0, 2);
  const extra = markers.length - shown.length;
  return (
    <span className="mt-0.5 flex w-full flex-col gap-0.5">
      {shown.map((marker) => (
        <span
          key={marker.id}
          className={`block truncate rounded px-0.5 text-[9px] font-semibold leading-tight @md:text-[11px] ${CHIP_CLASS[marker.type]}`}
        >
          {marker.groupName}
        </span>
      ))}
      {extra > 0 && (
        <span className="block truncate px-0.5 text-[9px] font-semibold leading-tight text-slate-500">+{extra}</span>
      )}
    </span>
  );
}

export function ReportCalendar({
  markers,
  days,
}: {
  markers: ReportDayMarker[];
  days: Record<string, ReactNode>;
}) {
  const byDate = useMemo(() => markersByDate(markers), [markers]);
  const open = useMemo(() => openingMonth(markers), [markers]);
  const [cursor, setCursor] = useState(open);
  const [selected, setSelected] = useState<string | undefined>(() =>
    latestDayInMonth(byDate, open.getFullYear(), open.getMonth()),
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = todayISO();
  const cells = monthCells(year, month);
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function showMonth(next: Date) {
    setCursor(next);
    setSelected(latestDayInMonth(byDate, next.getFullYear(), next.getMonth()));
  }

  return (
    <div className="@md:grid @md:grid-cols-2 @md:items-start @md:gap-4">
      <div>
        <div className="mb-2 flex items-center justify-between px-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => showMonth(new Date(year, month - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 active:bg-slate-200"
          >
            <ChevronLeftIcon width={20} height={20} />
          </button>
          <h2 className="text-sm font-bold">{monthLabel}</h2>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => showMonth(new Date(year, month + 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 active:bg-slate-200"
          >
            <ChevronRightIcon width={20} height={20} />
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50 px-1 py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {WEEKDAYS.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-100 p-px">
            {cells.map((iso, index) => {
              if (!iso) return <div key={`empty-${index}`} className="min-w-0 bg-white" />;
              const items = byDate.get(iso) ?? [];
              const isSelected = iso === selected;
              const isToday = iso === today;
              const names = items.map((marker) => marker.groupName).filter((name) => name.length > 0);
              return (
                <button
                  key={iso}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={
                    items.length
                      ? `${formatDate(iso)}, ${items.length} report${items.length === 1 ? "" : "s"}: ${names.join(", ")}`
                      : `${formatDate(iso)}, no reports`
                  }
                  onClick={() => setSelected(iso)}
                  className={`flex min-h-16 min-w-0 flex-col items-stretch bg-white px-0.5 py-1 text-left @md:min-h-24 ${
                    isSelected ? "ring-2 ring-inset ring-brand-700" : ""
                  }`}
                >
                  <span
                    className={`mx-auto flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isSelected
                        ? "bg-brand-700 text-white"
                        : isToday
                          ? "bg-brand-100 text-brand-800"
                          : "text-slate-700"
                    }`}
                  >
                    {parseLocalDate(iso).getDate()}
                  </span>
                  {items.length > 0 && <DayChips markers={items} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <section className="@container mt-4 @md:mt-0" aria-label={`Reports on ${formatDate(selected)}`}>
          <h3 className="mb-2 px-1 text-sm font-semibold">{formatDate(selected)}</h3>
          {days[selected] ?? <p className="px-1 text-sm text-slate-500">No reports on this day.</p>}
        </section>
      )}
    </div>
  );
}
