import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { FellowshipReport, FollowUpReport, NextFellowship, Report } from "@/data/types";
import { getGroupById, getUserById } from "@/lib/data-access";
import {
  NOT_AVAILABLE,
  REPORT_TYPE_EMOJI,
  REPORT_TYPE_LABELS,
  contactModeLabel,
  formatDate,
  formatRupees,
  todayISO,
} from "@/lib/format";
import { CalendarIcon, ChevronRightIcon, MapPinIcon } from "./icons";
import { Badge, Card, InfoRow } from "./ui";

function filedByName(report: Report) {
  return getUserById(report.filedBy)?.name ?? NOT_AVAILABLE;
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

function CardSummary({ report }: { report: Report }) {
  switch (report.type) {
    case "fellowship":
      return (
        <>
          <p className="text-slate-500">{formatDate(report.date)}</p>
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
          <p className="mt-2 font-semibold">{report.personName}</p>
          <p className="text-sm text-slate-600">{contactModeLabel(report.mode)}</p>
        </>
      );
    case "next-fellowship":
      return (
        <>
          <p className="text-slate-500">{formatDate(report.proposedDate)}</p>
          <p className="mt-2 font-semibold">{report.location}</p>
          <p className="line-clamp-2 text-sm text-slate-600">{report.activity}</p>
        </>
      );
  }
}

export function UpcomingBadge({ report }: { report: NextFellowship }) {
  return report.proposedDate >= todayISO() ? (
    <Badge tone="green">Upcoming</Badge>
  ) : (
    <Badge tone="slate">Past</Badge>
  );
}

export function ReportCard({ report }: { report: Report }) {
  const group = getGroupById(report.groupId);
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold">
            <span aria-hidden="true">{REPORT_TYPE_EMOJI[report.type]} </span>
            {REPORT_TYPE_LABELS[report.type]}
          </p>
          <p className="truncate text-sm font-medium text-brand-700">{group?.name}</p>
        </div>
        {report.type === "next-fellowship" && <UpcomingBadge report={report} />}
      </div>
      <div className="mt-2">
        <CardSummary report={report} />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <p className="min-w-0 truncate text-slate-500">
          Filed by <span className="font-medium text-slate-700">{filedByName(report)}</span>
        </p>
        <span className="flex shrink-0 items-center font-semibold text-brand-700">
          View <ChevronRightIcon width={18} height={18} />
        </span>
      </div>
    </Link>
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

function PhotoGrid({ photos }: { photos: string[] }) {
  if (!photos.length) return <span className="text-slate-400">No photos</span>;
  return (
    <div className="mt-1 grid grid-cols-3 gap-2">
      {photos.map((src, i) => (
        <a
          key={src + i}
          href={src}
          target="_blank"
          rel="noreferrer"
          className="relative block aspect-square overflow-hidden rounded-xl bg-slate-100"
        >
          <Image src={src} alt={`Photo ${i + 1}`} fill sizes="33vw" className="object-cover" unoptimized />
        </a>
      ))}
    </div>
  );
}

function FellowshipDetail({ report }: { report: FellowshipReport }) {
  return (
    <>
      <InfoRow label="Date">{formatDate(report.date)}</InfoRow>
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

function FollowUpDetail({ report }: { report: FollowUpReport }) {
  return (
    <>
      <InfoRow label="Date">{formatDate(report.date)}</InfoRow>
      <InfoRow label="Person followed up">{report.personName}</InfoRow>
      <InfoRow label="Mode of Contact">{contactModeLabel(report.mode)}</InfoRow>
      <TextBlock label="Comments, Prayer Requests & Testimonies">{report.comments}</TextBlock>
    </>
  );
}

function NextFellowshipDetail({ report }: { report: NextFellowship }) {
  return (
    <>
      <InfoRow label="Proposed Date">{formatDate(report.proposedDate)}</InfoRow>
      <InfoRow label="Location">{report.location}</InfoRow>
      <TextBlock label="Activity & Discussion">{report.activity}</TextBlock>
      <TextBlock label="Goals">{report.goals}</TextBlock>
    </>
  );
}

/** Full read-only view of a report; also used for the post-submit confirmation. */
export function ReportDetail({ report }: { report: Report }) {
  const group = getGroupById(report.groupId);
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold">
            <span aria-hidden="true">{REPORT_TYPE_EMOJI[report.type]} </span>
            {REPORT_TYPE_LABELS[report.type]}
          </p>
          <p className="font-medium text-brand-700">{group?.name}</p>
        </div>
        {report.type === "next-fellowship" && <UpcomingBadge report={report} />}
      </div>
      <dl className="mt-2 divide-y divide-slate-100 border-t border-slate-100">
        {report.type === "fellowship" && <FellowshipDetail report={report} />}
        {report.type === "follow-up" && <FollowUpDetail report={report} />}
        {report.type === "next-fellowship" && <NextFellowshipDetail report={report} />}
        <InfoRow label="Report Filed By">
          {filedByName(report)}
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
      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-center gap-2 text-lg font-bold">
        <CalendarIcon className="text-brand-700" />
        {formatDate(report.proposedDate)}
      </div>
      <div className="mt-1 flex items-center gap-2 text-slate-600">
        <MapPinIcon width={18} height={18} className="shrink-0 text-slate-400" />
        <span className="truncate">{report.location}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-slate-700">{report.activity}</p>
    </Link>
  );
}

export function LastFellowshipSummary({ report }: { report: FellowshipReport }) {
  return (
    <Link
      href={`/reports/${report.id}`}
      className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">{formatDate(report.date)}</p>
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
