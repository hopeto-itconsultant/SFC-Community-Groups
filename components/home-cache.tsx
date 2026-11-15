"use client";

import type { ReactNode } from "react";
import { CachedPage } from "@/components/CachedPage";
import { HomeScreen } from "@/components/HomeScreen";
import { HomeSkeleton } from "@/components/page-skeletons";
import { isHomeModel } from "@/lib/page-models";

export function HomeCached({ children }: { children: ReactNode }) {
  return (
    <CachedPage
      pageKey="home"
      skeleton={<HomeSkeleton />}
      render={(data) => (isHomeModel(data) ? <HomeScreen model={data} /> : null)}
    >
      {children}
    </CachedPage>
  );
}
