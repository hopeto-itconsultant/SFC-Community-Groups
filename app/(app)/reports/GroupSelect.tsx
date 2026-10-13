"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { inputClass } from "@/components/form";
import { type ReportsParams, reportsHref } from "./hrefs";

const ALL_GROUPS = "all";

/** Admin's group filter; changing it reloads the list for that group. */
export function GroupSelect({
  groups,
  params,
}: {
  groups: { id: string; name: string }[];
  params: ReportsParams;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <select
      aria-label="Filter by group"
      value={params.group ?? ALL_GROUPS}
      disabled={pending}
      onChange={(e) => {
        const group = e.target.value === ALL_GROUPS ? undefined : e.target.value;
        startTransition(() => router.replace(reportsHref({ ...params, group })));
      }}
      className={`${inputClass} font-medium disabled:opacity-60`}
    >
      <option value={ALL_GROUPS}>All Groups</option>
      {groups.map((g) => (
        <option key={g.id} value={g.id}>
          {g.name}
        </option>
      ))}
    </select>
  );
}
