import Link from "next/link";
import type { ReactNode } from "react";
import type { NextFellowship, ReportType } from "@/data/types";
import type { ReportTypeSummaries } from "@/lib/report-rules";
import {
  CONTACT_MODES,
  REPORT_TYPE_EMOJI,
  formatDateTimeDay,
  formatRupees,
  formatShortDate,
  formatShortDateDay,
} from "@/lib/format";
import { CalendarIcon, ChevronRightIcon, DateCalendarIcon, MapPinIcon } from "./icons";

/** Compact "next fellowship" summary for home and group screens. */
export function NextFellowshipSummary({ report }: { report: NextFellowship }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      prefetch={false}
      className="cv-item block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-center gap-2 text-lg font-bold">
        <DateCalendarIcon date={report.proposedDate} />
        <span className="min-w-0">{formatDateTimeDay(report.proposedDate, report.time)}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-slate-600">
        <MapPinIcon width={18} height={18} className="shrink-0 text-slate-400" />
        <span className="truncate">{report.location}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-slate-700">{report.activity}</p>
    </Link>
  );
}

function StatTile({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-slate-50 px-2 py-1.5">
      <p className="truncate text-lg font-bold leading-tight">{value}</p>
      <p className="truncate text-[11px] font-medium text-slate-500">{label}</p>
    </div>
  );
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="rounded-lg bg-slate-50 px-2 py-2.5 text-sm text-slate-500">{children}</p>;
}

function FellowshipTypeBody({ summary }: { summary: ReportTypeSummaries["fellowship"] }) {
  if (!summary.total) return <EmptyNote>No reports yet</EmptyNote>;
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile value={summary.thisMonth} label="This month" />
      <StatTile value={summary.avgAttendance} label="Avg. attendance" />
      <StatTile value={summary.totalFirstTimers} label="First-timers" />
    </div>
  );
}

function FollowUpTypeBody({ summary }: { summary: ReportTypeSummaries["followUp"] }) {
  if (!summary.total) return <EmptyNote>No reports yet</EmptyNote>;
  return (
    <div className="grid grid-cols-4 gap-2">
      <StatTile value={summary.thisMonth} label="This month" />
      {CONTACT_MODES.map((m) => (
        <StatTile key={m.value} value={summary.byMode[m.value]} label={`${m.emoji} ${m.label}`} />
      ))}
    </div>
  );
}

function NextFellowshipTypeBody({ summary }: { summary: ReportTypeSummaries["nextFellowship"] }) {
  const { nextDate } = summary;
  if (!nextDate) return <EmptyNote>No upcoming fellowship planned</EmptyNote>;
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile value={summary.nextDateCount} label={formatShortDateDay(nextDate)} />
      <StatTile value={summary.thisWeekCount} label="This week" />
      <StatTile value={summary.thisMonthCount} label="This month" />
    </div>
  );
}

function ExpenditureTypeBody({ summary }: { summary: ReportTypeSummaries["expenditure"] }) {
  if (!summary.count) return <EmptyNote>No expenses recorded yet</EmptyNote>;
  return (
    <div className="grid grid-cols-3 gap-2">
      <StatTile value={formatRupees(summary.thisMonthAmount)} label="This month" />
      <StatTile value={formatRupees(summary.totalAmount)} label="Total spent" />
      <StatTile value={formatRupees(summary.avgAmount)} label="Avg. per fellowship" />
    </div>
  );
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function withLastDate(total: number, word: string, lastDate: string | undefined, withDay = false) {
  const count = plural(total, word);
  if (!lastDate) return count;
  const when = withDay ? formatShortDateDay(lastDate) : formatShortDate(lastDate);
  return `${count} · Last ${when}`;
}

/** Report types plus the expenditure view, which is derived from fellowship reports. */
export type ReportCardKind = ReportType | "expenditure";

export const CARD_LABELS: Record<ReportCardKind, string> = {
  fellowship: "Fellowships",
  "follow-up": "Follow-ups",
  "next-fellowship": "Next Fellowship(s)",
  expenditure: "Expenditures",
};

const CARD_EMOJI: Record<ReportCardKind, string> = {
  ...REPORT_TYPE_EMOJI,
  expenditure: "💰",
};

function typeCardMeta(kind: ReportCardKind, summaries: ReportTypeSummaries) {
  switch (kind) {
    case "expenditure": {
      const { count, lastDate } = summaries.expenditure;
      return {
        subtitle: withLastDate(count, "expense", lastDate),
        body: <ExpenditureTypeBody summary={summaries.expenditure} />,
      };
    }
    case "fellowship": {
      const { total, lastDate } = summaries.fellowship;
      return {
        subtitle: withLastDate(total, "report", lastDate, true),
        body: <FellowshipTypeBody summary={summaries.fellowship} />,
      };
    }
    case "follow-up": {
      const { total, lastDate } = summaries.followUp;
      return {
        subtitle: withLastDate(total, "report", lastDate),
        body: <FollowUpTypeBody summary={summaries.followUp} />,
      };
    }
    case "next-fellowship":
      return {
        subtitle: `${summaries.nextFellowship.upcomingCount} upcoming`,
        body: <NextFellowshipTypeBody summary={summaries.nextFellowship} />,
      };
  }
}

/** Overview card for one report type on the Reports screen. */
export function ReportTypeCard({
  kind,
  summaries,
  href,
}: {
  kind: ReportCardKind;
  summaries: ReportTypeSummaries;
  href: string;
}) {
  const { subtitle, body } = typeCardMeta(kind, summaries);
  return (
    <Link
      href={href}
      prefetch={false}
      className="block rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-lg text-brand-700"
          aria-hidden="true"
        >
          {kind === "next-fellowship" ? <CalendarIcon width={20} height={20} /> : CARD_EMOJI[kind]}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">{CARD_LABELS[kind]}</p>
          <p className="truncate text-xs text-slate-500">{subtitle}</p>
        </div>
        <ChevronRightIcon width={20} height={20} className="shrink-0 text-brand-700" />
      </div>
      <div className="mt-2">{body}</div>
    </Link>
  );
}
