"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { NextFellowship } from "@/data/types";
import { NextFellowshipForm } from "@/components/NextFellowshipForm";
import { PageHeader } from "@/components/PageHeader";
import { ReportDetail } from "@/components/reports";
import { NotAvailable } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SubmittedView";
import { LinkButton } from "@/components/ui";
import { canEditPlan, getGroupById, getReportById } from "@/lib/data-access";
import { useCurrentUser } from "@/lib/session";

export default function EditPlanPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const [updated, setUpdated] = useState<NextFellowship | null>(null);
  const report = getReportById(id);
  const group = getGroupById(report?.groupId);

  if (!report || report.type !== "next-fellowship" || !group) {
    return <NotAvailable message="This plan could not be found." />;
  }
  if (!updated && !canEditPlan(user, report)) {
    return (
      <NotAvailable message="Only Admin and this group's leaders can change an upcoming plan." />
    );
  }

  const detailHref = `/reports/${report.id}`;

  if (updated) {
    return (
      <>
        <PageHeader title="Plan updated" backHref={detailHref} />
        <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <SavedBanner title="Next fellowship updated" />
          <ReportDetail report={updated} />
          <LinkButton href="/home" size="lg" block className="mt-6">
            Back to Home
          </LinkButton>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Edit Plan" subtitle={group.name} backHref={detailHref} />
      <NextFellowshipForm
        user={user}
        group={group}
        initial={report}
        submitLabel="SAVE CHANGES"
        onSubmit={(next) => {
          setUpdated(next);
          window.scrollTo(0, 0);
        }}
      />
    </>
  );
}
