import type { ReportType } from "@/data/types";
import { CacheCommit } from "@/components/CachedPage";
import { ReportsCached } from "@/components/reports-cache";
import { ReportsOverview } from "@/components/ReportsOverview";
import { getRealUser, requireUser } from "@/lib/auth";
import { getGroupById, getReportTypeSummaries } from "@/lib/data-access";
import { REPORT_TYPE_LABELS } from "@/lib/format";
import type { ReportsOverviewModel } from "@/lib/page-models";
import type { ReportPeriod } from "@/lib/report-rules";
import { isAdminRole } from "@/lib/roles";
import { scopeKeyForUser } from "@/lib/shell";
import { ReportsView } from "./ReportsView";

const PERIODS: ReportPeriod[] = ["this-month", "upcoming"];

function asReportType(value: unknown): ReportType | undefined {
  return typeof value === "string" && Object.hasOwn(REPORT_TYPE_LABELS, value) ? (value as ReportType) : undefined;
}

function asPeriod(value: unknown): ReportPeriod | undefined {
  return PERIODS.find((period) => period === value);
}

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const { group, type, period, view } = await searchParams;
  const groupId = typeof group === "string" ? group : undefined;
  const reportType = asReportType(type);
  const reportPeriod = asPeriod(period);
  const expenses = view === "expenses";

  if (!reportType && !reportPeriod && !expenses) {
    const pageKey = `reports:${groupId ?? "all"}`;
    return (
      <ReportsCached pageKey={pageKey}>
        <ReportsOverviewContent groupId={groupId} pageKey={pageKey} />
      </ReportsCached>
    );
  }

  const user = await requireUser();
  return (
    <ReportsView user={user} groupId={groupId} type={reportType} period={reportPeriod} expenses={expenses} />
  );
}

async function ReportsOverviewContent({ groupId, pageKey }: { groupId?: string; pageKey: string }) {
  const [user, real] = await Promise.all([requireUser(), getRealUser()]);
  const isAdmin = isAdminRole(user.role);
  const requestedId = isAdmin ? groupId : user.groupId;
  const [group, scopedSummaries] = await Promise.all([
    getGroupById(requestedId),
    getReportTypeSummaries(requestedId),
  ]);
  // A group id that does not exist means every group.
  const summaries = requestedId && !group ? await getReportTypeSummaries() : scopedSummaries;
  const model: ReportsOverviewModel = {
    subtitle: isAdmin ? (group?.name ?? "All groups") : group?.name,
    isAdmin,
    groupId: isAdmin ? group?.id : undefined,
    summaries,
  };
  const loginAsId = real && real.id !== user.id ? user.id : null;
  return (
    <CacheCommit scopeKey={scopeKeyForUser(user, loginAsId)} pageKey={pageKey} data={model}>
      <ReportsOverview model={model} />
    </CacheCommit>
  );
}
