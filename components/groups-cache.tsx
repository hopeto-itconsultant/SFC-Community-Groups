"use client";

import type { ReactNode } from "react";
import { CachedPage } from "@/components/CachedPage";
import { GroupsScreen } from "@/components/GroupsScreen";
import { ListSkeleton } from "@/components/page-skeletons";
import { isGroupsModel } from "@/lib/page-models";

export function GroupsCached({ pageKey, children }: { pageKey: string; children: ReactNode }) {
  return (
    <CachedPage
      pageKey={pageKey}
      skeleton={<ListSkeleton />}
      render={(data) => (isGroupsModel(data) ? <GroupsScreen model={data} /> : null)}
    >
      {children}
    </CachedPage>
  );
}
