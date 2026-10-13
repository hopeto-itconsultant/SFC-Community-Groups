import type { ReportType } from "@/data/types";
import { requireUser } from "@/lib/auth";
import { REPORT_TYPE_LABELS } from "@/lib/format";
import type { ReportPeriod } from "@/lib/report-rules";
import { ReportsView } from "./ReportsView";

const PERIODS: ReportPeriod[] = ["this-month", "upcoming"];

function asReportType(value: unknown): ReportType | undefined {
  return typeof value === "string" && Object.hasOwn(REPORT_TYPE_LABELS, value)
    ? (value as ReportType)
    : undefined;
}

function asPeriod(value: unknown): ReportPeriod | undefined {
  return PERIODS.find((p) => p === value);
}

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const [{ group, type, period, view }, user] = await Promise.all([searchParams, requireUser()]);
  return (
    <ReportsView
      user={user}
      groupId={typeof group === "string" ? group : undefined}
      type={asReportType(type)}
      period={asPeriod(period)}
      expenses={view === "expenses"}
    />
  );
}
