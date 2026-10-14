"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { Report, ReportType } from "@/data/types";
import { getGroupById, getReportDate } from "@/lib/data-access";
import { formatDate, parseLocalDate, todayISO, toISODate } from "@/lib/format";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

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
function openingMonth(reports: Report[]): Date {
  const today = parseLocalDate(todayISO());
  const current = monthStart(today.getFullYear(), today.getMonth());
  const inCurrent = reports.some((report) => {
    const date = parseLocalDate(getReportDate(report));
    return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
  });
  if (inCurrent || reports.length === 0) return current;
  const newest = reports.reduce((best, report) => {
    const date = getReportDate(report);
    return date > best ? date : best;
  }, getReportDate(reports[0]));
  const parsed = parseLocalDate(newest);
  return monthStart(parsed.getFullYear(), parsed.getMonth());
}

function latestDayInMonth(byDate: Map<string, Report[]>, year: number, month: number): string | undefined {
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

function DayChips({ reports }: { reports: Report[] }) {
  const shown = reports.slice(0, 2);
  const extra = reports.length - shown.length;
  return (
    <span className="mt-0.5 flex w-full flex-col gap-0.5">
      {shown.map((report) => (
        <span
          key={report.id}
          className={`block truncate rounded px-0.5 text-[9px] font-semibold leading-tight ${CHIP_CLASS[report.type]}`}
        >
          {getGroupById(report.groupId)?.name}
        </span>
      ))}
      {extra > 0 && (
        <span className="block truncate px-0.5 text-[9px] font-semibold leading-tight text-slate-500">
          +{extra}
        </span>
      )}
    </span>
  );
}

export function ReportCalendar({
  reports,
  renderDay,
}: {
  reports: Report[];
  renderDay: (reports: Report[]) => ReactNode;
}) {
  const byDate = useMemo(() => {
    const grouped = new Map<string, Report[]>();
    for (const report of reports) {
      const iso = getReportDate(report).slice(0, 10);
      const day = grouped.get(iso);
      if (day) day.push(report);
      else grouped.set(iso, [report]);
    }
    return grouped;
  }, [reports]);

  const [cursor, setCursor] = useState(() => openingMonth(reports));
  const [selected, setSelected] = useState<string | undefined>(() =>
    latestDayInMonth(byDate, openingMonth(reports).getFullYear(), openingMonth(reports).getMonth()),
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const today = todayISO();
  const cells = monthCells(year, month);
  const dayReports = selected ? (byDate.get(selected) ?? []) : [];
  const monthLabel = cursor.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  function showMonth(next: Date) {
    setCursor(next);
    setSelected(latestDayInMonth(byDate, next.getFullYear(), next.getMonth()));
  }

  return (
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
            const names = items
              .map((report) => getGroupById(report.groupId)?.name)
              .filter((name): name is string => !!name);
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
                className={`flex min-h-16 min-w-0 flex-col items-stretch bg-white px-0.5 py-1 text-left ${
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
                {items.length > 0 && <DayChips reports={items} />}
              </button>
            );
          })}
        </div>
      </div>

      {selected && (
        <section className="mt-4" aria-label={`Reports on ${formatDate(selected)}`}>
          <h3 className="mb-2 px-1 text-sm font-semibold">{formatDate(selected)}</h3>
          {dayReports.length ? (
            renderDay(dayReports)
          ) : (
            <p className="px-1 text-sm text-slate-500">No reports on this day.</p>
          )}
        </section>
      )}
    </div>
  );
}
