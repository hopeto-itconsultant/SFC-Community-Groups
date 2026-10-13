import type { ReportType } from "@/data/types";
import type { ReportPeriod } from "@/lib/report-rules";

export interface ReportsParams {
  type?: ReportType;
  period?: ReportPeriod;
  group?: string;
  expenses?: boolean;
}

export function reportsHref(params: ReportsParams): string {
  const query = new URLSearchParams();
  if (params.expenses) query.set("view", "expenses");
  if (params.type) query.set("type", params.type);
  if (params.period) query.set("period", params.period);
  if (params.group) query.set("group", params.group);
  const qs = query.toString();
  return qs ? `/reports?${qs}` : "/reports";
}
