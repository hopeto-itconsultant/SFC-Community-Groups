import type { ReportType } from "@/data/types";
import type { ReportPeriod } from "@/lib/data-access";
import { REPORT_TYPE_LABELS } from "@/lib/format";
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
  const { group, type, period, view } = await searchParams;
  return (
    <ReportsView
      initialGroupId={typeof group === "string" ? group : undefined}
      initialType={asReportType(type)}
      initialPeriod={asPeriod(period)}
      expenses={view === "expenses"}
    />
  );
}
