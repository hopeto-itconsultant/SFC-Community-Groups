"use client";

import { type ReactNode, useState } from "react";
import type { FellowshipReport, FollowUpReport, ReportType } from "@/data/types";
import { inputClass } from "@/components/form";
import { PlusIcon, XIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import {
  CARD_LABELS,
  ExpenseCard,
  FellowshipListRow,
  FollowUpTable,
  ReportCard,
  ReportTypeCard,
} from "@/components/reports";
import { EmptyState, LinkButton } from "@/components/ui";
import {
  type ReportPeriod,
  getGroupById,
  getGroups,
  getReportTypeSummaries,
  getReports,
} from "@/lib/data-access";
import { CONTACT_MODES, formatRupees } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

const REPORT_TYPES: ReportType[] = ["fellowship", "follow-up", "next-fellowship"];

const ALL_GROUPS = "all";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "this-month": "Filed this month",
  upcoming: "Upcoming only",
};

const PERIOD_TITLES: Record<ReportPeriod, string> = {
  "this-month": "Filed this month",
  upcoming: "Upcoming",
};

function reportsHref(params: {
  type?: ReportType;
  period?: ReportPeriod;
  group?: string;
  expenses?: boolean;
}) {
  const query = new URLSearchParams();
  if (params.expenses) query.set("view", "expenses");
  if (params.type) query.set("type", params.type);
  if (params.period) query.set("period", params.period);
  if (params.group) query.set("group", params.group);
  const qs = query.toString();
  return qs ? `/reports?${qs}` : "/reports";
}

/** Admins pick any group (or all); leaders and asst. leaders are fixed to their own. */
function useGroupScope(initialGroupId: string | undefined) {
  const { user, group } = useCurrentUser();
  const isAdmin = user.role === "admin";
  const [groupFilter, setGroupFilter] = useState(
    getGroupById(initialGroupId) ? initialGroupId! : ALL_GROUPS,
  );
  const groupId = isAdmin ? (groupFilter === ALL_GROUPS ? undefined : groupFilter) : group?.id;
  const subtitle = isAdmin ? (getGroupById(groupId)?.name ?? "All groups") : group?.name;
  return { isAdmin, groupFilter, setGroupFilter, groupId, subtitle };
}

function GroupSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      aria-label="Filter by group"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputClass} font-medium`}
    >
      <option value={ALL_GROUPS}>All Groups</option>
      {getGroups().map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}

function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 border-b border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur">
      {children}
    </div>
  );
}

function NewReportButton({ href, label }: { href: string; label: string }) {
  return (
    <LinkButton href={href} className="min-h-10 px-3 text-sm">
      <PlusIcon width={18} height={18} />
      {label}
    </LinkButton>
  );
}

export function ReportsView({
  initialGroupId,
  initialType,
  initialPeriod,
  expenses = false,
}: {
  initialGroupId?: string;
  initialType?: ReportType;
  initialPeriod?: ReportPeriod;
  expenses?: boolean;
}) {
  if (expenses || initialType || initialPeriod) {
    return (
      <ReportsTypeList
        key={`${expenses}-${initialType}-${initialPeriod}`}
        initialGroupId={initialGroupId}
        type={expenses ? "fellowship" : initialType}
        initialPeriod={initialPeriod}
        expenses={expenses}
      />
    );
  }
  return <ReportsOverview initialGroupId={initialGroupId} />;
}

function ReportsOverview({ initialGroupId }: { initialGroupId?: string }) {
  const { isAdmin, groupId, subtitle } = useGroupScope(initialGroupId);
  const summaries = getReportTypeSummaries(groupId);

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={subtitle}
        action={!isAdmin && <NewReportButton href="/new" label="New Report" />}
      />

      <div className="space-y-2.5 px-4 py-3">
        {REPORT_TYPES.map((type) => (
          <ReportTypeCard
            key={type}
            kind={type}
            summaries={summaries}
            href={reportsHref({ type, group: isAdmin ? groupId : undefined })}
          />
        ))}
        <ReportTypeCard
          kind="expenditure"
          summaries={summaries}
          href={reportsHref({ expenses: true, group: isAdmin ? groupId : undefined })}
        />
      </div>
    </>
  );
}

function ReportsTypeList({
  initialGroupId,
  type,
  initialPeriod,
  expenses,
}: {
  initialGroupId?: string;
  type?: ReportType;
  initialPeriod?: ReportPeriod;
  expenses: boolean;
}) {
  const { isAdmin, groupFilter, setGroupFilter, groupId, subtitle } = useGroupScope(initialGroupId);
  const [period, setPeriod] = useState<ReportPeriod | undefined>(initialPeriod);
  const reports = getReports({ groupId, type, period, withExpense: expenses });

  const title = expenses
    ? CARD_LABELS.expenditure
    : type
      ? CARD_LABELS[type]
      : period
        ? PERIOD_TITLES[period]
        : "All Reports";
  const totalSpent = reports.reduce(
    (sum, r) => sum + (r.type === "fellowship" ? (r.expenseAmount ?? 0) : 0),
    0,
  );
  const allGroupsAdmin = isAdmin && !groupId && !expenses;
  const fellowshipListing = allGroupsAdmin && type === "fellowship";
  const followUpTable = allGroupsAdmin && type === "follow-up";
  const fellowshipReports = reports.filter((r): r is FellowshipReport => r.type === "fellowship");
  const followUpReports = reports.filter((r): r is FollowUpReport => r.type === "follow-up");
  const totalAttendees = fellowshipReports.reduce((sum, r) => sum + r.attendees, 0);
  const totalFirstTimers = fellowshipReports.reduce((sum, r) => sum + r.firstTimers, 0);

  return (
    <>
      <PageHeader
        title={title}
        subtitle={subtitle}
        backHref={reportsHref({ group: isAdmin ? groupId : undefined })}
        action={
          !isAdmin &&
          (type ? (
            <NewReportButton href={`/new/${type}`} label="New" />
          ) : (
            <NewReportButton href="/new" label="New Report" />
          ))
        }
      />

      {isAdmin && (
        <FilterBar>
          <GroupSelect value={groupFilter} onChange={setGroupFilter} />
        </FilterBar>
      )}

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <p className="text-sm text-slate-500">
            {reports.length} report{reports.length === 1 ? "" : "s"}
            {expenses && (
              <>
                {" · "}
                <span className="font-semibold text-slate-700">{formatRupees(totalSpent)}</span> total
              </>
            )}
            {fellowshipListing && (
              <>
                {" · "}
                {totalAttendees} attendees · {totalFirstTimers} first-timers
              </>
            )}
            {followUpTable &&
              CONTACT_MODES.map((m) => (
                <span key={m.value}>
                  {" · "}
                  {followUpReports.filter((r) => r.mode === m.value).length}{" "}
                  <span role="img" aria-label={m.label}>
                    {m.emoji}
                  </span>
                </span>
              ))}
          </p>
          {period && (
            <button
              type="button"
              onClick={() => setPeriod(undefined)}
              aria-label={`Remove filter: ${PERIOD_LABELS[period]}`}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
            >
              {PERIOD_LABELS[period]}
              <XIcon width={14} height={14} />
            </button>
          )}
        </div>
        {reports.length && fellowshipListing ? (
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
            {fellowshipReports.map((r) => (
              <FellowshipListRow key={r.id} report={r} />
            ))}
          </div>
        ) : reports.length && followUpTable ? (
          <FollowUpTable reports={followUpReports} />
        ) : reports.length ? (
          <div className="space-y-3">
            {reports.map((r) =>
              expenses && r.type === "fellowship" ? (
                <ExpenseCard key={r.id} report={r} />
              ) : (
                <ReportCard key={r.id} report={r} />
              ),
            )}
          </div>
        ) : (
          <EmptyState
            title="No reports found"
            description={
              period || (isAdmin && groupId) ? "Try a different filter." : "Nothing has been filed yet."
            }
          />
        )}
      </div>
    </>
  );
}
