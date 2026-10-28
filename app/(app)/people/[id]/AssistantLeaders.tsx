"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import type { AssistantLeader } from "@/lib/data-access";
import { formatDate } from "@/lib/format";
import { useDisplayName } from "@/lib/session";

const AssistantDetailsForm = dynamic(() =>
  import("./AssistantDetailsForm").then((m) => m.AssistantDetailsForm),
);

export function AssistantLeaders({
  assistants,
  showGroups = true,
}: {
  assistants: AssistantLeader[];
  /** Group names under each person. Off on My Group, where the group is already the page. */
  showGroups?: boolean;
}) {
  return (
    <>
      <SectionTitle>Asst. Leaders</SectionTitle>
      {assistants.length ? (
        <div className="space-y-2">
          {assistants.map((assistant) => (
            <AssistantCard key={assistant.id} assistant={assistant} showGroups={showGroups} />
          ))}
        </div>
      ) : (
        <p className="px-1 text-sm text-slate-500">No assistant leaders yet.</p>
      )}
    </>
  );
}

function AssistantCard({ assistant, showGroups }: { assistant: AssistantLeader; showGroups: boolean }) {
  const [editing, setEditing] = useState(false);
  const shown = useDisplayName();
  const groupLabel = assistant.groups.map((group) => group.name).join(", ");

  return (
    <Card className={assistant.active ? "" : "opacity-60"}>
      <p className="truncate font-bold">{shown(assistant.name)}</p>
      {showGroups && (
        <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
          <span className="min-w-0 truncate" title={groupLabel}>
            {groupLabel}
          </span>
          {assistant.groups.some((group) => group.status === "closed") && <Badge tone="slate">Closed</Badge>}
        </span>
      )}
      {!assistant.active && <p className="mt-1 text-sm font-medium text-slate-500">This login is deactivated.</p>}

      {editing ? (
        <AssistantDetailsForm assistant={assistant} onDone={() => setEditing(false)} />
      ) : (
        <>
          <dl className="mt-2 space-y-0.5 text-sm text-slate-600">
            <DetailLine label="Mobile" value={assistant.mobile} />
            <DetailLine label="Date of birth" value={assistant.dateOfBirth ? formatDate(assistant.dateOfBirth) : undefined} />
            <DetailLine label="Email" value={assistant.email} breakAll />
            <DetailLine label="Started serving" value={assistant.servingSince ? formatDate(assistant.servingSince) : undefined} />
          </dl>
          <Button variant="secondary" block className="mt-3" onClick={() => setEditing(true)}>
            Edit details
          </Button>
        </>
      )}
    </Card>
  );
}

function DetailLine({ label, value, breakAll }: { label: string; value?: string; breakAll?: boolean }) {
  return (
    <div>
      <dt className="inline text-slate-500">{label} </dt>
      <dd className={`inline ${value ? "" : "text-slate-400"} ${breakAll ? "break-all" : ""}`}>
        {value ?? "Not entered"}
      </dd>
    </div>
  );
}
