"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ReportDetail } from "@/components/reports";
import { NotAvailable } from "@/components/RoleGate";
import { getGroupById, getReportById } from "@/lib/data-access";
import { REPORT_TYPE_LABELS } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useCurrentUser();
  const report = getReportById(id);

  if (!report) return <NotAvailable message="This report could not be found." />;
  if (user.role !== "admin" && report.groupId !== user.groupId) {
    return <NotAvailable message="You can only view reports for your own group." />;
  }

  return (
    <>
      <PageHeader
        title={REPORT_TYPE_LABELS[report.type]}
        subtitle={getGroupById(report.groupId)?.name}
        backHref="/reports"
      />
      <div className="p-4">
        <ReportDetail report={report} />
      </div>
    </>
  );
}
