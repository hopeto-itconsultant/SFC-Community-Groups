import type { ReactNode } from "react";
import type { FellowshipReport, FollowUpReport, ReportType, User } from "@/data/types";
import { PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { RemovePeriodChip, ReportResults, type ReportListItem } from "@/components/ReportResults";
import { CARD_LABELS } from "@/components/reports";
import { LinkButton } from "@/components/ui";
import { getGroupById, getGroupChoices, getLabeledReports } from "@/lib/data-access";
import { getNameDisplay } from "@/lib/auth";
import { CONTACT_MODES, NOT_AVAILABLE, formatRupees } from "@/lib/format";
import { type ReportPeriod } from "@/lib/report-rules";
import { isAdminRole } from "@/lib/roles";
import { GroupSelect } from "./GroupSelect";
import { type ReportsParams, reportsHref } from "./hrefs";

const PERIOD_LABELS: Record<ReportPeriod, string> = {
  "this-month": "Filed this month",
  upcoming: "Upcoming only",
};

const PERIOD_TITLES: Record<ReportPeriod, string> = {
  "this-month": "Filed this month",
  upcoming: "Upcoming",
};

function FilterBar({ children }: { children: ReactNode }) {
  return <div className="border-b border-slate-200 bg-slate-100 px-4 py-3">{children}</div>;
}

function NewReportButton({ href, label }: { href: string; label: string }) {
  return (
    <LinkButton href={href} className="min-h-10 px-3 text-sm">
      <PlusIcon width={18} height={18} />
      {label}
    </LinkButton>
  );
}

/** Filtered report list. The overview (no type, period, or expenses) is cached separately. */
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
  const isAdmin = isAdminRole(user.role);
  const requestedId = isAdmin ? groupId : user.groupId;
  const [group, choices, shown] = await Promise.all([
    getGroupById(requestedId),
    isAdmin ? getGroupChoices() : Promise.resolve([]),
    getNameDisplay(),
  ]);
  // An unknown group id means every group, matching the previous lookup.
  const scopedGroupId = group?.id;
  const labeled = await getLabeledReports({
    groupId: scopedGroupId,
    type: expenses ? "fellowship" : type,
    period,
    withExpense: expenses,
  });
  const items: ReportListItem[] = labeled.map((item) => ({
    report:
      item.report.type === "follow-up"
        ? { ...item.report, personName: shown(item.report.personName) }
        : item.report,
    groupName: item.groupName,
    filerName: item.filerName ? shown(item.filerName) : NOT_AVAILABLE,
  }));
  const reports = items.map((item) => item.report);
  const subtitle = isAdmin ? (group?.name ?? "All groups") : group?.name;
  const params: ReportsParams = {
    type: expenses ? undefined : type,
    period,
    expenses,
    group: isAdmin ? scopedGroupId : undefined,
  };
  const title = expenses
    ? CARD_LABELS.expenditure
    : type
      ? CARD_LABELS[type]
      : period
        ? PERIOD_TITLES[period]
        : "All Reports";
  const totalSpent = reports.reduce((sum, report) => sum + (report.type === "fellowship" ? (report.expenseAmount ?? 0) : 0), 0);
  const allGroupsAdmin = isAdmin && !scopedGroupId && !expenses;
  const fellowshipListing = allGroupsAdmin && type === "fellowship";
  const followUpTable = allGroupsAdmin && type === "follow-up";
  const fellowshipReports = reports.filter((report): report is FellowshipReport => report.type === "fellowship");
  const followUpReports = reports.filter((report): report is FollowUpReport => report.type === "follow-up");
  const totalAttendees = fellowshipReports.reduce((sum, report) => sum + report.attendees, 0);
  const totalFirstTimers = fellowshipReports.reduce((sum, report) => sum + report.firstTimers, 0);
  const upcomingList = type === "next-fellowship" && period !== "this-month";
  const emptyDescription = upcomingList
    ? "No upcoming fellowship planned."
    : period || (isAdmin && scopedGroupId)
      ? "Try a different filter."
      : "Nothing has been filed yet.";
  const activeChoices = choices.filter((choice) => choice.status === "active");

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

      {isAdmin && (
        <FilterBar>
          <GroupSelect groups={activeChoices.map(({ id, name }) => ({ id, name }))} params={params} />
        </FilterBar>
      )}

      <div className="p-4">
        <ReportResults
          calendarKey={`${scopedGroupId ?? "all"}-${type ?? "all"}-${period ?? "any"}-${expenses}`}
          items={items}
          expenses={expenses}
          fellowshipListing={fellowshipListing}
          followUpTable={followUpTable}
          emptyDescription={emptyDescription}
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
                CONTACT_MODES.map((mode) => (
                  <span key={mode.value}>
                    {" · "}
                    {followUpReports.filter((report) => report.mode === mode.value).length}{" "}
                    <span role="img" aria-label={mode.label}>
                      {mode.emoji}
                    </span>
                  </span>
                ))}
            </p>
          }
          periodChip={
            period && !upcomingList ? (
              <RemovePeriodChip
                href={reportsHref({ ...params, period: undefined })}
                label={PERIOD_LABELS[period]}
              />
            ) : undefined
          }
        />
      </div>
    </>
  );
}
