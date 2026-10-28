import type { ReportType, User } from "@/data/types";
import { PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { ReportTypeCard } from "@/components/report-cards";
import { LinkButton } from "@/components/ui";
import { getGroupById, getReportTypeSummaries } from "@/lib/data-access";
import type { ReportPeriod } from "@/lib/report-rules";
import { isAdminRole } from "@/lib/roles";
import { type ReportsScope, reportsHref } from "./hrefs";

const REPORT_TYPES: ReportType[] = ["fellowship", "follow-up", "next-fellowship"];

/** Admins pick any group (or all); leaders and asst. leaders are fixed to their own. */
async function groupScope(user: User, requestedGroupId: string | undefined): Promise<ReportsScope> {
  const isAdmin = isAdminRole(user.role);
  const group = await getGroupById(isAdmin ? requestedGroupId : user.groupId);
  return {
    isAdmin,
    groupId: group?.id,
    subtitle: isAdmin ? (group?.name ?? "All groups") : group?.name,
  };
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
    const { ReportsTypeList } = await import("./ReportsTypeList");
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

async function ReportsOverview({ scope: { isAdmin, groupId, subtitle } }: { scope: ReportsScope }) {
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
        {REPORT_TYPES.map((reportType) => (
          <ReportTypeCard
            key={reportType}
            kind={reportType}
            summaries={summaries}
            href={reportsHref({ type: reportType, group })}
          />
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
