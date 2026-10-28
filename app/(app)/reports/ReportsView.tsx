import Link from "next/link";
import type { ReactNode } from "react";
import type { FellowshipReport, FollowUpReport, Report, ReportType, User } from "@/data/types";
import { PlusIcon, XIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { ReportCalendar, type ReportDayMarker } from "@/components/ReportCalendar";
import {
  CARD_LABELS,
  ExpenseCard,
  FellowshipListRow,
  FollowUpTable,
  ReportCard,
  ReportTypeCard,
} from "@/components/reports";
import { EmptyState, LinkButton } from "@/components/ui";
import { ReportLayoutSwitch } from "@/components/ViewToggle";
import { getGroupById, getGroups, getReportTypeSummaries, getReports } from "@/lib/data-access";
import { CONTACT_MODES, formatRupees } from "@/lib/format";
import { getReportDate, type ReportPeriod } from "@/lib/report-rules";
import { isAdminRole } from "@/lib/roles";
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
  const isAdmin = isAdminRole(user.role);
  const group = await getGroupById(isAdmin ? requestedGroupId : user.groupId);
  return {
    isAdmin,
    groupId: group?.id,
    subtitle: isAdmin ? (group?.name ?? "All groups") : group?.name,
  };
}

function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">
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

      <div className="grid grid-cols-1 gap-2.5 px-4 py-3 @md:grid-cols-2">
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

/** Keeps getReports order, including the order of reports on the same day. */
function groupReportsByDate(reports: Report[]): Map<string, Report[]> {
  const grouped = new Map<string, Report[]>();
  for (const report of reports) {
    const iso = getReportDate(report);
    const day = grouped.get(iso);
    if (day) day.push(report);
    else grouped.set(iso, [report]);
  }
  return grouped;
}

function ReportCollection({
  reports,
  expenses,
  fellowshipListing,
  followUpTable,
}: {
  reports: Report[];
  expenses: boolean;
  fellowshipListing: boolean;
  followUpTable: boolean;
}) {
  if (fellowshipListing) {
    const fellowshipReports = reports.filter((r): r is FellowshipReport => r.type === "fellowship");
    return (
      <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70">
        {fellowshipReports.map((r) => (
          <FellowshipListRow key={r.id} report={r} />
        ))}
      </div>
    );
  }

  if (followUpTable) {
    const followUpReports = reports.filter((r): r is FollowUpReport => r.type === "follow-up");
    return <FollowUpTable reports={followUpReports} />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 @md:grid-cols-2">
      {reports.map((r) =>
        expenses && r.type === "fellowship" ? (
          <ExpenseCard key={r.id} report={r} />
        ) : (
          <ReportCard key={r.id} report={r} />
        ),
      )}
    </div>
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
  const namedGroups = await Promise.all([...new Set(reports.map((r) => r.groupId))].map((id) => getGroupById(id)));
  const groupNames = new Map(namedGroups.flatMap((group) => (group ? [[group.id, group.name] as const] : [])));
  const markers: ReportDayMarker[] = reports.map((report) => ({
    id: report.id,
    date: getReportDate(report),
    type: report.type,
    groupName: groupNames.get(report.groupId) ?? "",
  }));
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
  const days: Record<string, ReactNode> = {};
  for (const [date, dayReports] of groupReportsByDate(reports)) {
    days[date] = (
      <ReportCollection
        reports={dayReports}
        expenses={expenses}
        fellowshipListing={fellowshipListing}
        followUpTable={followUpTable}
      />
    );
  }
  const emptyDescription =
    period || (isAdmin && groupId) ? "Try a different filter." : "Nothing has been filed yet.";

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
        <ReportLayoutSwitch
          summary={
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
          }
          periodChip={
            period ? (
              <Link
                href={reportsHref({ ...params, period: undefined })}
                replace
                aria-label={`Remove filter: ${PERIOD_LABELS[period]}`}
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
              >
                {PERIOD_LABELS[period]}
                <XIcon width={14} height={14} />
              </Link>
            ) : undefined
          }
          grid={
            reports.length ? (
              <ReportCollection
                reports={reports}
                expenses={expenses}
                fellowshipListing={fellowshipListing}
                followUpTable={followUpTable}
              />
            ) : (
              <EmptyState title="No reports found" description={emptyDescription} />
            )
          }
          calendar={
            reports.length ? (
              <ReportCalendar
                key={`${groupId ?? "all"}-${type ?? "all"}-${period ?? "any"}-${expenses}`}
                markers={markers}
                days={days}
              />
            ) : (
              <EmptyState title="No reports found" description={emptyDescription} />
            )
          }
        />
      </div>
    </>
  );
}
