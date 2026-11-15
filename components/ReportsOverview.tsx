import { PageHeader } from "@/components/PageHeader";
import { ReportTypeCard } from "@/components/reports";
import type { ReportType } from "@/data/types";
import type { ReportsOverviewModel } from "@/lib/page-models";
import { reportsHref } from "@/app/(app)/reports/hrefs";
import { LinkButton } from "@/components/ui";
import { PlusIcon } from "@/components/icons";

const REPORT_TYPES: ReportType[] = ["fellowship", "follow-up", "next-fellowship"];

export function ReportsOverview({ model }: { model: ReportsOverviewModel }) {
  const group = model.isAdmin ? model.groupId : undefined;
  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={model.subtitle}
        action={
          !model.isAdmin && (
            <LinkButton href="/new" className="min-h-10 px-3 text-sm">
              <PlusIcon width={18} height={18} />
              New Report
            </LinkButton>
          )
        }
      />
      <div className="grid grid-cols-1 gap-2.5 px-4 py-3 @md:grid-cols-2">
        {REPORT_TYPES.map((type) => (
          <ReportTypeCard key={type} kind={type} summaries={model.summaries} href={reportsHref({ type, group })} />
        ))}
        <ReportTypeCard
          kind="expenditure"
          summaries={model.summaries}
          href={reportsHref({ expenses: true, group })}
        />
      </div>
    </>
  );
}
