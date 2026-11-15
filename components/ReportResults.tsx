"use client";

import Link from "next/link";
import { type ReactNode, useMemo } from "react";
import type { FollowUpReport, Report } from "@/data/types";
import { XIcon } from "@/components/icons";
import { ReportCalendar, type ReportDayMarker } from "@/components/ReportCalendar";
import {
  ExpenseListRow,
  FellowshipListRow,
  FollowUpTable,
  ReportListRow,
  ReportListShell,
} from "@/components/reports";
import { EmptyState } from "@/components/ui";
import { ReportLayoutToggle, useReportsPageLayout } from "@/components/ViewToggle";
import { getReportDate } from "@/lib/report-rules";

export interface ReportListItem {
  report: Report;
  groupName: string;
  filerName: string;
}

const identity = (name: string) => name;

function groupByDate(items: ReportListItem[]): Map<string, ReportListItem[]> {
  const grouped = new Map<string, ReportListItem[]>();
  for (const item of items) {
    const iso = getReportDate(item.report);
    const day = grouped.get(iso);
    if (day) day.push(item);
    else grouped.set(iso, [item]);
  }
  return grouped;
}

function ReportCollection({
  items,
  expenses,
  fellowshipListing,
  followUpTable,
}: {
  items: ReportListItem[];
  expenses: boolean;
  fellowshipListing: boolean;
  followUpTable: boolean;
}) {
  if (fellowshipListing) {
    return (
      <ReportListShell>
        {items.map((item) =>
          item.report.type === "fellowship" ? (
            <FellowshipListRow key={item.report.id} report={item.report} groupName={item.groupName} />
          ) : null,
        )}
      </ReportListShell>
    );
  }

  if (followUpTable) {
    const reports = items
      .map((item) => item.report)
      .filter((report): report is FollowUpReport => report.type === "follow-up");
    const groupNames = new Map(items.map((item) => [item.report.groupId, item.groupName]));
    return <FollowUpTable reports={reports} groupNames={groupNames} shown={identity} />;
  }

  const showType = new Set(items.map((item) => item.report.type)).size > 1;
  return (
    <ReportListShell>
      {items.map((item) =>
        expenses && item.report.type === "fellowship" ? (
          <ExpenseListRow key={item.report.id} report={item.report} groupName={item.groupName} />
        ) : (
          <ReportListRow
            key={item.report.id}
            report={item.report}
            groupName={item.groupName}
            shown={identity}
            showType={showType}
          />
        ),
      )}
    </ReportListShell>
  );
}

/** Calendar or list, whichever was saved under `sfc.reportsLayout`. Only that one is built. */
export function ReportResults({
  summary,
  periodChip,
  items,
  expenses,
  fellowshipListing,
  followUpTable,
  emptyDescription,
  calendarKey,
}: {
  summary: ReactNode;
  periodChip?: ReactNode;
  items: ReportListItem[];
  expenses: boolean;
  fellowshipListing: boolean;
  followUpTable: boolean;
  emptyDescription: string;
  calendarKey: string;
}) {
  const [layout, setLayout] = useReportsPageLayout();
  const markers = useMemo<ReportDayMarker[]>(
    () =>
      items.map((item) => ({
        id: item.report.id,
        date: getReportDate(item.report),
        type: item.report.type,
        groupName: item.groupName,
      })),
    [items],
  );
  const days = useMemo(() => {
    if (layout !== "calendar") return {};
    const next: Record<string, ReactNode> = {};
    for (const [date, dayItems] of groupByDate(items)) {
      next[date] = (
        <ReportCollection
          items={dayItems}
          expenses={expenses}
          fellowshipListing={fellowshipListing}
          followUpTable={followUpTable}
        />
      );
    }
    return next;
  }, [layout, items, expenses, fellowshipListing, followUpTable]);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div className="min-w-0 flex-1">{summary}</div>
        <div className="flex shrink-0 items-center gap-2">
          {periodChip}
          <ReportLayoutToggle view={layout} onChange={setLayout} />
        </div>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No reports found" description={emptyDescription} />
      ) : layout === "calendar" ? (
        <ReportCalendar key={calendarKey} markers={markers} days={days} />
      ) : (
        <ReportCollection
          items={items}
          expenses={expenses}
          fellowshipListing={fellowshipListing}
          followUpTable={followUpTable}
        />
      )}
    </>
  );
}

export function RemovePeriodChip({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      replace
      aria-label={`Remove filter: ${label}`}
      className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
    >
      {label}
      <XIcon width={14} height={14} />
    </Link>
  );
}
