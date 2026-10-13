import Link from "next/link";
import type { ReactNode } from "react";
import type { FellowshipReport, FollowUpReport, ReportType, User } from "@/data/types";
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
import { getGroupById, getGroups, getReportTypeSummaries, getReports } from "@/lib/data-access";
import { CONTACT_MODES, formatRupees } from "@/lib/format";
import type { ReportPeriod } from "@/lib/report-rules";
import { GroupSelect } from "./GroupSelect";
import { type ReportsParams, reportsHref } from "./hrefs";

const REPORT_TYPES: ReportType[] = ["fellowship", "follow-up", "next-fellowship"];

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "this-month": "Filed this month",
  upcoming: "Upcoming only",
};

const PERIOD_TITLES: Record<ReportPeriod, string> = {
  "this-month": "Filed this month",
  upcoming: "Upcoming",
};

/** Admins pick any group (or all); leaders and asst. leaders are fixed to their own. */
async function groupScope(user: User, requestedGroupId: string | undefined) {
  const isAdmin = user.role === "admin";
  const group = await getGroupById(isAdmin ? requestedGroupId : user.groupId);
  return {
    isAdmin,
    groupId: group?.id,
    subtitle: isAdmin ? (group?.name ?? "All groups") : group?.name,
  };
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

export async function ReportsView({
  user,
  groupId,
  type,
  period,
  expenses = false,
}: {
  user: User;
  groupId?: string;
  type?: ReportType;
  period?: ReportPeriod;
  expenses?: boolean;
}) {
  const scope = await groupScope(user, groupId);
  if (expenses || type || period) {
    return (
      <ReportsTypeList
        scope={scope}
        type={expenses ? "fellowship" : type}
        period={period}
        expenses={expenses}
      />
    );
  }
  return <ReportsOverview scope={scope} />;
}

type Scope = Awaited<ReturnType<typeof groupScope>>;

async function ReportsOverview({ scope: { isAdmin, groupId, subtitle } }: { scope: Scope }) {
  const summaries = await getReportTypeSummaries(groupId);
  const group = isAdmin ? groupId : undefined;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={subtitle}
        action={!isAdmin && <NewReportButton href="/new" label="New Report" />}
      />

      <div className="space-y-2.5 px-4 py-3">
        {REPORT_TYPES.map((type) => (
          <ReportTypeCard key={type} kind={type} summaries={summaries} href={reportsHref({ type, group })} />
        ))}
        <ReportTypeCard
          kind="expenditure"
          summaries={summaries}
          href={reportsHref({ expenses: true, group })}
        />
      </div>
    </>
  );
}

async function AdminGroupFilter({ params }: { params: ReportsParams }) {
  const groups = await getGroups();
  return (
    <FilterBar>
      <GroupSelect groups={groups.map(({ id, name }) => ({ id, name }))} params={params} />
    </FilterBar>
  );
}

async function ReportsTypeList({
  scope: { isAdmin, groupId, subtitle },
  type,
  period,
  expenses,
}: {
  scope: Scope;
  type?: ReportType;
  period?: ReportPeriod;
  expenses: boolean;
}) {
  const reports = await getReports({ groupId, type, period, withExpense: expenses });
  const params: ReportsParams = {
    type: expenses ? undefined : type,
    period,
    expenses,
    group: isAdmin ? groupId : undefined,
  };

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
        backHref={reportsHref({ group: params.group })}
        action={
          !isAdmin &&
          (type ? (
            <NewReportButton href={`/new/${type}`} label="New" />
          ) : (
            <NewReportButton href="/new" label="New Report" />
          ))
        }
      />

      {isAdmin && <AdminGroupFilter params={params} />}

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
            <Link
              href={reportsHref({ ...params, period: undefined })}
              replace
              aria-label={`Remove filter: ${PERIOD_LABELS[period]}`}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
            >
              {PERIOD_LABELS[period]}
              <XIcon width={14} height={14} />
            </Link>
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
