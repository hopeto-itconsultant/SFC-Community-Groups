import { NextFellowshipForm } from "@/components/NextFellowshipForm";
import { PageHeader } from "@/components/PageHeader";
import { NotAvailable } from "@/components/RoleGate";
import { FellowshipForm } from "@/app/(app)/new/fellowship/FellowshipForm";
import { FollowUpForm } from "@/app/(app)/new/follow-up/FollowUpForm";
import { updateFellowshipReport, updateFollowUpReport, updatePlan } from "@/lib/actions/reports";
import { requireUser } from "@/lib/auth";
import { getGroupById, getReportById, isLatestFiledReport } from "@/lib/data-access";
import { canEditFiledReport, canEditPlan } from "@/lib/report-rules";

export default async function EditReportPage({ params }: PageProps<"/reports/[id]/edit">) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const report = await getReportById(id);
  const group = await getGroupById(report?.groupId);
  if (!report || !group) return <NotAvailable message="This report could not be found." />;

  if (report.type === "next-fellowship") {
    if (!canEditPlan(user, report)) {
      return <NotAvailable message="Only Admin and this group's leaders can change an upcoming plan." />;
    }
    return (
      <>
        <PageHeader title="Edit Plan" note={group.name} backHref={`/reports/${report.id}`} />
        <NextFellowshipForm
          user={user}
          group={group}
          initial={report}
          submitLabel="SAVE CHANGES"
          action={updatePlan.bind(null, report.id)}
        />
      </>
    );
  }

  if (!canEditFiledReport(user, report, group, await isLatestFiledReport(report))) {
    return <NotAvailable message="This report can no longer be changed." />;
  }

  return (
    <>
      <PageHeader
        title={report.type === "fellowship" ? "Edit Report" : "Edit Follow-up"}
        note={group.name}
        backHref={`/reports/${report.id}`}
      />
      {report.type === "fellowship" ? (
        <FellowshipForm
          user={user}
          group={group}
          initial={report}
          submitLabel="SAVE CHANGES"
          action={updateFellowshipReport.bind(null, report.id)}
        />
      ) : (
        <FollowUpForm
          user={user}
          group={group}
          initial={report}
          submitLabel="SAVE CHANGES"
          action={updateFollowUpReport.bind(null, report.id)}
        />
      )}
    </>
  );
}
