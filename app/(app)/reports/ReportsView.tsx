"use client";

import { useState } from "react";
import type { ReportType } from "@/data/types";
import { inputClass } from "@/components/form";
import { PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { ReportCard } from "@/components/reports";
import { EmptyState, LinkButton } from "@/components/ui";
import { getGroupById, getGroups, getReports } from "@/lib/data-access";
import { useCurrentUser } from "@/lib/session";

type TypeFilter = "all" | ReportType;

const TYPE_FILTERS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "fellowship", label: "Fellowship" },
  { value: "follow-up", label: "Follow-up" },
  { value: "next-fellowship", label: "Next Fellowship" },
];

const ALL_GROUPS = "all";

export function ReportsView({ initialGroupId }: { initialGroupId?: string }) {
  const { user, group } = useCurrentUser();
  const isAdmin = user.role === "admin";

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [groupFilter, setGroupFilter] = useState(
    getGroupById(initialGroupId) ? initialGroupId! : ALL_GROUPS,
  );

  const groupId = isAdmin ? (groupFilter === ALL_GROUPS ? undefined : groupFilter) : group?.id;
  const reports = getReports({
    groupId,
    type: typeFilter === "all" ? undefined : typeFilter,
  });

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle={isAdmin ? "All groups" : group?.name}
        action={
          !isAdmin && (
            <LinkButton href="/new" className="min-h-10 px-3 text-sm">
              <PlusIcon width={18} height={18} />
              New Report
            </LinkButton>
          )
        }
      />

      <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-10 space-y-3 border-b border-slate-200 bg-slate-100/95 px-4 py-3 backdrop-blur">
        {isAdmin && (
          <select
            aria-label="Filter by group"
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className={`${inputClass} font-medium`}
          >
            <option value={ALL_GROUPS}>All Groups</option>
            {getGroups().map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
        <div role="tablist" aria-label="Report type" className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {TYPE_FILTERS.map((f) => {
            const active = typeFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTypeFilter(f.value)}
                className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-700 text-white"
                    : "bg-white text-slate-700 ring-1 ring-inset ring-slate-200"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        <p className="mb-3 px-1 text-sm text-slate-500">
          {reports.length} report{reports.length === 1 ? "" : "s"}
        </p>
        {reports.length ? (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} />
            ))}
          </div>
        ) : (
          <EmptyState title="No reports found" description="Try a different filter." />
        )}
      </div>
    </>
  );
}
