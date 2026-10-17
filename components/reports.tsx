import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type {
  FellowshipReport,
  FollowUpReport,
  NextFellowship,
  Report,
  ReportType,
} from "@/data/types";
import { getNameDisplay } from "@/lib/auth";
import { getGroupById, getGroups, getUserById } from "@/lib/data-access";
import type { ReportTypeSummaries } from "@/lib/report-rules";
import {
  CONTACT_MODES,
  NOT_AVAILABLE,
  REPORT_TYPE_EMOJI,
  REPORT_TYPE_LABELS,
  contactModeLabel,
  formatDate,
  formatDateTime,
  formatRupees,
  formatShortDate,
  formatShortDateTime,
  todayISO,
} from "@/lib/format";
import { photoVariant } from "@/lib/photos";
import { CalendarIcon, ChevronRightIcon, DateCalendarIcon, MapPinIcon } from "./icons";
import { PhotoGrid } from "./PhotoGrid";
import { Badge, Card, InfoRow } from "./ui";

type NameDisplay = (name: string) => string;

/** The report's group, the filer's name, and the name formatter for the signed-in person. */
async function groupAndFiler(report: Report) {
  const [group, filer, shown] = await Promise.all([
    getGroupById(report.groupId),
    getUserById(report.filedBy),
    getNameDisplay(),
  ]);
  return [group, filer ? shown(filer.name) : NOT_AVAILABLE, shown] as const;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function CardSummary({ report, shown }: { report: Report; shown: NameDisplay }) {
  switch (report.type) {
    case "fellowship":
      return (
        <>
          <p className="text-slate-500">{formatDateTime(report.date, report.time)}</p>
          <p className="mt-2 font-semibold">{plural(report.attendees, "attendee")}</p>
          <p className="text-sm text-slate-600">
            {plural(report.firstTimers, "first-time attendee")}
          </p>
        </>
      );
    case "follow-up":
      return (
        <>
          <p className="text-slate-500">{formatDate(report.date)}</p>
          <p className="mt-2 font-semibold">{shown(report.personName)}</p>
          <p className="text-sm text-slate-600">{contactModeLabel(report.mode)}</p>
        </>
      );
    case "next-fellowship":
      return (
        <>
          <p className="text-slate-500">{formatDateTime(report.proposedDate, report.time)}</p>
          <p className="mt-2 font-semibold">{report.location}</p>
          <p className="line-clamp-2 text-sm text-slate-600">{report.activity}</p>
        </>
      );
  }
}

export function UpcomingBadge({ report }: { report: NextFellowship }) {
  if (report.cancelledAt) return <Badge tone="amber">Cancelled</Badge>;
  return report.proposedDate >= todayISO() ? (
    <Badge tone="green">Upcoming</Badge>
  ) : (
    <Badge tone="slate">Past</Badge>
  );
}

function ReportIdentity({
  report,
  groupName,
  large = false,
}: {
  report: Report;
  groupName?: string;
  large?: boolean;
}) {
  if (report.type === "next-fellowship") {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <DateCalendarIcon date={report.proposedDate} />
        <p className={`min-w-0 truncate text-brand-700 ${large ? "text-lg font-bold" : "font-bold"}`}>
          <span className="sr-only">Next Fellowship, </span>
          {groupName}
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <p className={large ? "text-lg font-bold" : "font-bold"}>
        <span aria-hidden="true">{REPORT_TYPE_EMOJI[report.type]} </span>
        {REPORT_TYPE_LABELS[report.type]}
      </p>
      <p className={`truncate text-brand-700 ${large ? "font-medium" : "text-sm font-medium"}`}>{groupName}</p>
    </div>
  );
}

export async function ReportCard({ report }: { report: Report }) {
  const [group, filedBy, shown] = await groupAndFiler(report);
  return (
    <Link
      href={`/reports/${report.id}`}
      prefetch={false}
      className="cv-item block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <ReportIdentity report={report} groupName={group?.name} />
        </div>
        {report.type === "next-fellowship" && <UpcomingBadge report={report} />}
      </div>
      <div className="mt-2">
        <CardSummary report={report} shown={shown} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <p className="min-w-0 truncate text-slate-500">
          Filed by <span className="font-medium text-slate-700">{filedBy}</span>
        </p>
        <span className="flex shrink-0 items-center font-semibold text-brand-700">
          View <ChevronRightIcon width={18} height={18} />
        </span>
      </div>
    </Link>
  );
}

/** List item for the expenditures view: the amount and what it was spent on. */
export async function ExpenseCard({ report }: { report: FellowshipReport }) {
  const [group, filedBy] = await groupAndFiler(report);
  return (
    <Link
      href={`/reports/${report.id}`}
      prefetch={false}
      className="cv-item block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-lg font-bold">{formatRupees(report.expenseAmount ?? 0)}</p>
          <p className="truncate text-sm font-medium text-brand-700">{group?.name}</p>
        </div>
        <p className="shrink-0 text-sm text-slate-500">{formatDateTime(report.date, report.time)}</p>
      </div>
      {report.expenseDetails && (
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{report.expenseDetails}</p>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <p className="min-w-0 truncate text-slate-500">
          Filed by <span className="font-medium text-slate-700">{filedBy}</span>
        </p>
        <span className="flex shrink-0 items-center font-semibold text-brand-700">
          View <ChevronRightIcon width={18} height={18} />
        </span>
      </div>
    </Link>
  );
}

/** Dense row for the all-groups fellowship listing. */
export async function FellowshipListRow({ report }: { report: FellowshipReport }) {
  const group = await getGroupById(report.groupId);
  return (
    <Link
      href={`/reports/${report.id}`}
      prefetch={false}
      className="flex items-center gap-2 px-3 py-2.5 active:bg-slate-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <p className="shrink-0 text-sm font-bold">{formatShortDateTime(report.date, report.time)}</p>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-brand-700">{group?.name}</p>
          <p className="shrink-0 text-sm">
            <span className="font-bold">{report.attendees}</span>
            {report.firstTimers > 0 && (
              <span className="ml-1 text-xs font-semibold text-emerald-700">+{report.firstTimers} new</span>
            )}
          </p>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPinIcon width={14} height={14} className="shrink-0 text-slate-400" />
          <span className="min-w-0 truncate">{report.location}</span>
          {!!report.expenseAmount && (
            <span className="shrink-0"> · {formatRupees(report.expenseAmount)}</span>
          )}
        </div>
        {report.summary && <p className="mt-0.5 line-clamp-1 text-xs text-slate-600">{report.summary}</p>}
      </div>
      {report.photos[0] && (
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
          <Image
            src={photoVariant(report.photos[0], 192)}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-brand-700" />
    </Link>
  );
}

const FOLLOW_UP_COLS =
  "grid grid-cols-[3.25rem_minmax(0,1fr)_minmax(0,1fr)_auto] items-baseline gap-x-2";

function ModeCell({ mode }: { mode: FollowUpReport["mode"] }) {
  const m = CONTACT_MODES.find((c) => c.value === mode);
  if (!m) return <>{mode}</>;
  return (
    <>
      <span aria-hidden="true">{m.emoji}</span>
      <span className="sr-only sm:not-sr-only sm:ml-1">{m.label}</span>
    </>
  );
}

/** Column-aligned table of follow-ups for the all-groups view. */
export async function FollowUpTable({ reports }: { reports: FollowUpReport[] }) {
  const [groups, shown] = await Promise.all([getGroups({ includeClosed: true }), getNameDisplay()]);
  const groupNames = new Map(groups.map((g) => [g.id, g.name]));
  return (
    <div
      role="table"
      aria-label="Follow-ups"
      className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70"
    >
      <div
        role="row"
        className={`${FOLLOW_UP_COLS} bg-slate-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500`}
      >
        <span role="columnheader">Date</span>
        <span role="columnheader">Person</span>
        <span role="columnheader">Group</span>
        <span role="columnheader">Mode</span>
      </div>
      {reports.map((r) => (
        <Link
          key={r.id}
          href={`/reports/${r.id}`}
          prefetch={false}
          role="row"
          className={`${FOLLOW_UP_COLS} px-3 py-2 text-sm active:bg-slate-50`}
        >
          <span role="cell" className="font-bold">
            {formatShortDate(r.date)}
          </span>
          <span role="cell" className="truncate font-medium">
            {shown(r.personName)}
          </span>
          <span role="cell" className="truncate text-brand-700">
            {groupNames.get(r.groupId)}
          </span>
          <span role="cell" className="whitespace-nowrap text-slate-600">
            <ModeCell mode={r.mode} />
          </span>
          {r.comments && (
            <span role="cell" className="col-span-3 col-start-2 line-clamp-1 text-xs text-slate-500">
              {r.comments}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

function TextBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <InfoRow label={label}>
      <span className="whitespace-pre-wrap">
        {children || <span className="text-slate-400">{NOT_AVAILABLE}</span>}
      </span>
    </InfoRow>
  );
}

function FellowshipDetail({ report }: { report: FellowshipReport }) {
  return (
    <>
      <InfoRow label="Date">{formatDateTime(report.date, report.time)}</InfoRow>
      <InfoRow label="Location">{report.location}</InfoRow>
      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="Attendees">{report.attendees}</InfoRow>
        <InfoRow label="First-time">{report.firstTimers}</InfoRow>
      </div>
      <TextBlock label="Summary of Activity">{report.summary}</TextBlock>
      <TextBlock label="Comments, Prayer Requests & Testimonies">{report.comments}</TextBlock>
      <InfoRow label="Expenditure">
        {report.expenseAmount ? (
          <>
            <span className="font-semibold">{formatRupees(report.expenseAmount)}</span>
            {report.expenseDetails && <span className="text-slate-600"> · {report.expenseDetails}</span>}
          </>
        ) : (
          <span className="text-slate-400">None</span>
        )}
      </InfoRow>
      <InfoRow label={`Photos (${report.photos.length})`}>
        <PhotoGrid photos={report.photos} />
      </InfoRow>
    </>
  );
}

function FollowUpDetail({ report, shown }: { report: FollowUpReport; shown: NameDisplay }) {
  return (
    <>
      <InfoRow label="Date">{formatDate(report.date)}</InfoRow>
      <InfoRow label="Person followed up">{shown(report.personName)}</InfoRow>
      <InfoRow label="Mode of Contact">{contactModeLabel(report.mode)}</InfoRow>
      <TextBlock label="Comments, Prayer Requests & Testimonies">{report.comments}</TextBlock>
    </>
  );
}

function NextFellowshipDetail({ report }: { report: NextFellowship }) {
  return (
    <>
      <InfoRow label="Proposed Date">{formatDateTime(report.proposedDate, report.time)}</InfoRow>
      <InfoRow label="Location">{report.location}</InfoRow>
      <TextBlock label="Activity & Discussion">{report.activity}</TextBlock>
      <TextBlock label="Goals">{report.goals}</TextBlock>
      {report.cancelledAt && <InfoRow label="Cancelled">{formatDate(report.cancelledAt)}</InfoRow>}
    </>
  );
}

/** Full read-only view of a report; also used for the post-submit confirmation. */
export async function ReportDetail({ report }: { report: Report }) {
  const [group, filedBy, shown] = await groupAndFiler(report);
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <ReportIdentity report={report} groupName={group?.name} large />
        </div>
        {report.type === "next-fellowship" && <UpcomingBadge report={report} />}
      </div>
      <dl className="mt-2 divide-y divide-slate-100 border-t border-slate-100">
        {report.type === "fellowship" && <FellowshipDetail report={report} />}
        {report.type === "follow-up" && <FollowUpDetail report={report} shown={shown} />}
        {report.type === "next-fellowship" && <NextFellowshipDetail report={report} />}
        <InfoRow label="Report Filed By">
          {filedBy}
          <span className="text-slate-500"> · {formatDate(report.createdAt)}</span>
        </InfoRow>
      </dl>
    </Card>
  );
}

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
        <span className="min-w-0">{formatDateTime(report.proposedDate, report.time)}</span>
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
      <StatTile value={summary.nextDateCount} label={formatShortDate(nextDate)} />
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

function withLastDate(total: number, word: string, lastDate: string | undefined) {
  const count = plural(total, word);
  return lastDate ? `${count} · Last ${formatShortDate(lastDate)}` : count;
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
        subtitle: withLastDate(total, "report", lastDate),
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

export function LastFellowshipSummary({ report }: { report: FellowshipReport }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      prefetch={false}
      className="cv-item block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{formatDateTime(report.date, report.time)}</p>
        <span className="flex items-center text-sm font-semibold text-brand-700">
          View <ChevronRightIcon width={18} height={18} />
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold">{report.attendees}</p>
          <p className="text-xs font-medium text-slate-500">Attendance</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-2xl font-bold">{report.firstTimers}</p>
          <p className="text-xs font-medium text-slate-500">First-time attendees</p>
        </div>
      </div>
    </Link>
  );
}
