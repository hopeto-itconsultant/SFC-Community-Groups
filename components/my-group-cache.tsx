"use client";

import type { ReactNode } from "react";
import { CachedPage } from "@/components/CachedPage";
import { MyGroupScreen } from "@/components/MyGroupScreen";
import { DetailSkeleton } from "@/components/page-skeletons";
import { isMyGroupModel } from "@/lib/page-models";

export function MyGroupCached({ children }: { children: ReactNode }) {
  return (
    <CachedPage
      pageKey="my-group"
      skeleton={<DetailSkeleton />}
      render={(data) => (isMyGroupModel(data) ? <MyGroupScreen model={data} /> : null)}
    >
      {children}
    </CachedPage>
  );
}
