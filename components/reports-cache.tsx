"use client";

import type { ReactNode } from "react";
import { CachedPage } from "@/components/CachedPage";
import { ReportsSkeleton } from "@/components/page-skeletons";
import { ReportsOverview } from "@/components/ReportsOverview";
import { isReportsOverviewModel } from "@/lib/page-models";

export function ReportsCached({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  return (
    <CachedPage
      pageKey={pageKey}
      skeleton={<ReportsSkeleton />}
      render={(data) => (isReportsOverviewModel(data) ? <ReportsOverview model={data} /> : null)}
    >
      {children}
    </CachedPage>
  );
}
