import type { ReportType } from "@/data/types";
import { PageHeader } from "@/components/PageHeader";
import { ReportDetail } from "@/components/reports";
import { NotAvailable } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SavedBanner";
import { LinkButton } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { getGroupById, getReportById, isLatestFiledReport } from "@/lib/data-access";
import { REPORT_TYPE_LABELS } from "@/lib/format";
import { canEditFiledReport, canEditPlan } from "@/lib/report-rules";
import { PlanActions } from "./PlanActions";

const NEW_REPORT: Record<ReportType, { title: string; another: string }> = {
  fellowship: { title: "Fellowship report submitted", another: "New Fellowship Report" },
  "follow-up": { title: "Follow-up submitted", another: "New Follow-up" },
  "next-fellowship": { title: "Next fellowship saved", another: "Plan another" },
};

const UPDATED_REPORT: Record<ReportType, string> = {
  fellowship: "Fellowship report updated",
  "follow-up": "Follow-up updated",
  "next-fellowship": "Next fellowship updated",
};

export default async function ReportDetailPage({ params, searchParams }: PageProps<"/reports/[id]">) {
  const [{ id }, { saved }, user] = await Promise.all([params, searchParams, requireUser()]);
  const report = await getReportById(id);
  if (!report) return <NotAvailable message="This report could not be found." />;
  const group = await getGroupById(report.groupId);
  const canEditFiled =
    !!group &&
    (report.type === "fellowship" || report.type === "follow-up") &&
    canEditFiledReport(user, report, group, await isLatestFiledReport(report));

  const banner =
    saved === "new"
      ? NEW_REPORT[report.type].title
      : saved === "updated"
        ? UPDATED_REPORT[report.type]
        : saved === "cancelled"
          ? "Plan cancelled"
          : undefined;

  return (
    <>
      <PageHeader
        title={REPORT_TYPE_LABELS[report.type]}
        subtitle={group?.name}
        backHref={saved ? "/home" : "/reports"}
      />
      <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        {banner && <SavedBanner title={banner} />}
        <ReportDetail report={report} />
        {report.type === "next-fellowship" && canEditPlan(user, report) && <PlanActions planId={report.id} />}
        {canEditFiled && (
          <div className="mt-4">
            <LinkButton href={`/reports/${report.id}/edit`} variant="secondary" block>
              Edit report
            </LinkButton>
          </div>
        )}
        {saved === "new" && (
          <div className="mt-6 space-y-2">
            <LinkButton href="/home" size="lg" block>
              Back to Home
            </LinkButton>
            <LinkButton href={`/new/${report.type}`} variant="secondary" size="lg" block>
              {NEW_REPORT[report.type].another}
            </LinkButton>
          </div>
        )}
      </div>
    </>
  );
}
