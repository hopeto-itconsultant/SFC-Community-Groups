"use client";

import type { ReactNode } from "react";
import { CachedPage } from "@/components/CachedPage";
import { HomeScreen } from "@/components/HomeScreen";
import { HomeSkeleton } from "@/components/page-skeletons";
import { HOME_PAGE_KEY, isHomeModel } from "@/lib/page-models";

export function HomeCached({ children }: { children: ReactNode }) {
  return (
    <CachedPage
      pageKey={HOME_PAGE_KEY}
      skeleton={<HomeSkeleton />}
      render={(data) => (isHomeModel(data) ? <HomeScreen model={data} /> : null)}
    >
      {children}
    </CachedPage>
  );
}
