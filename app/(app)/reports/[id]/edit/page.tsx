import { NextFellowshipForm } from "@/components/NextFellowshipForm";
import { PageHeader } from "@/components/PageHeader";
import { NotAvailable } from "@/components/RoleGate";
import { updatePlan } from "@/lib/actions/reports";
import { requireUser } from "@/lib/auth";
import { getGroupById, getReportById } from "@/lib/data-access";
import { canEditPlan } from "@/lib/report-rules";

export default async function EditPlanPage({ params }: PageProps<"/reports/[id]/edit">) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const report = await getReportById(id);
  const group = await getGroupById(report?.groupId);

  if (!report || report.type !== "next-fellowship" || !group) {
    return <NotAvailable message="This plan could not be found." />;
  }
  if (!canEditPlan(user, report)) {
    return <NotAvailable message="Only Admin and this group's leaders can change an upcoming plan." />;
  }

  return (
    <>
      <PageHeader title="Edit Plan" subtitle={group.name} backHref={`/reports/${report.id}`} />
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
