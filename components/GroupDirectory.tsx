"use client";

import { PageHeader } from "@/components/PageHeader";
import { GroupDetailCard, GroupListItem, GroupMiniCard, GroupSummaryRow } from "@/components/groups";
import { Card, SectionTitle } from "@/components/ui";
import { useStoredView } from "@/components/ViewToggle";
import { ViewToggle } from "@/components/ViewToggle";
import type { GroupCardModel } from "@/lib/page-models";

/** Cards or list, whichever was saved. Only the visible one is rendered. */
export function GroupDirectory({
  storageKey,
  title,
  subtitle,
  placement,
  variant,
  groups,
}: {
  storageKey: string;
  title: string;
  subtitle?: string;
  placement: "page" | "section";
  variant: "mini" | "detail";
  groups: GroupCardModel[];
}) {
  const [view, setView] = useStoredView(storageKey);
  const toggle = <ViewToggle view={view} onChange={setView} />;

  return (
    <>
      {placement === "page" ? (
        <PageHeader title={title} subtitle={subtitle} action={toggle} />
      ) : (
        <SectionTitle action={toggle} className="mb-1.5 mt-3">
          {title}
        </SectionTitle>
      )}
      {view === "list" ? (
        variant === "mini" ? (
          <Card className="divide-y divide-slate-100 overflow-hidden p-0">
            {groups.map((group) => (
              <GroupSummaryRow key={group.id} group={group} />
            ))}
          </Card>
        ) : (
          <div className="space-y-2 p-4">
            {groups.map((group) => (
              <GroupListItem key={group.id} group={group} />
            ))}
          </div>
        )
      ) : variant === "mini" ? (
        <div className="grid grid-cols-2 gap-2 @md:grid-cols-3">
          {groups.map((group) => (
            <GroupMiniCard key={group.id} group={group} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 @md:grid-cols-3 @lg:grid-cols-4">
          {groups.map((group) => (
            <GroupDetailCard key={group.id} group={group} />
          ))}
        </div>
      )}
    </>
  );
}
