"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import type { NextFellowship, Report } from "@/data/types";
import { PageHeader } from "@/components/PageHeader";
import { ReportDetail } from "@/components/reports";
import { NotAvailable } from "@/components/RoleGate";
import { SavedBanner } from "@/components/SubmittedView";
import { Button, ConfirmCard, LinkButton } from "@/components/ui";
import { canEditPlan, getGroupById, getReportById } from "@/lib/data-access";
import { REPORT_TYPE_LABELS, nowLocalISO } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const stored = getReportById(id);
  const [cancelledAt, setCancelledAt] = useState<string | null>(null);

  if (!stored) return <NotAvailable message="This report could not be found." />;
  if (user.role !== "admin" && stored.groupId !== user.groupId) {
    return <NotAvailable message="You can only view reports for your own group." />;
  }

  const report: Report =
    cancelledAt && stored.type === "next-fellowship" ? { ...stored, cancelledAt } : stored;

  return (
    <>
      <PageHeader
        title={REPORT_TYPE_LABELS[report.type]}
        subtitle={getGroupById(report.groupId)?.name}
        backHref="/reports"
      />
      <div className="p-4">
        {cancelledAt && <SavedBanner title="Plan cancelled" />}
        <ReportDetail report={report} />
        {report.type === "next-fellowship" && canEditPlan(user, report) && (
          <PlanActions plan={report} onCancel={() => setCancelledAt(nowLocalISO())} />
        )}
      </div>
    </>
  );
}

function PlanActions({ plan, onCancel }: { plan: NextFellowship; onCancel: () => void }) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="mt-4">
        <ConfirmCard
          title="Cancel this fellowship plan?"
          description="The plan will no longer show as upcoming. It stays in the group's reports."
          confirmLabel="Cancel plan"
          onBack={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onCancel();
            window.scrollTo(0, 0);
          }}
        />
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <LinkButton href={`/reports/${plan.id}/edit`} variant="secondary">
        Edit plan
      </LinkButton>
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Cancel plan
      </Button>
    </div>
  );
}
