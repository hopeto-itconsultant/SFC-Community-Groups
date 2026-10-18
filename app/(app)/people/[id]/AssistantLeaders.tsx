"use client";

import { useActionState, useEffect, useState } from "react";
import { Field, inputClass } from "@/components/form";
import { LeaderDetailFields } from "@/components/LeaderDetailFields";
import { MobileFields } from "@/components/MobileFields";
import { Badge, Button, Card, SectionTitle } from "@/components/ui";
import { updateMemberDetails, type MemberDetailsState } from "@/lib/actions/people";
import { DEFAULT_COUNTRY_ISO, splitMobile } from "@/lib/countries";
import type { AssistantLeader } from "@/lib/data-access";
import { formatDate } from "@/lib/format";
import { useDisplayName } from "@/lib/session";

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
        <DetailsForm assistant={assistant} onDone={() => setEditing(false)} />
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

function DetailsForm({ assistant, onDone }: { assistant: AssistantLeader; onDone: () => void }) {
  const [state, action, pending] = useActionState<MemberDetailsState, FormData>(
    updateMemberDetails.bind(null, assistant.id),
    {},
  );

  useEffect(() => {
    if (state.saved) onDone();
  }, [state.saved, onDone]);

  const stored = assistant.mobile ? splitMobile(assistant.mobile) : { iso: DEFAULT_COUNTRY_ISO, national: "" };

  return (
    <form action={action} className="mt-3 space-y-3 border-t border-slate-100 pt-3">
      <Field label="Name" required>
        <input
          name="name"
          type="text"
          required
          defaultValue={state.values?.name ?? assistant.name}
          autoComplete="off"
          autoCapitalize="words"
          className={inputClass}
        />
      </Field>
      <MobileFields
        required={assistant.hasLogin}
        country={state.values?.country ?? stored.iso}
        mobile={state.values?.mobile ?? stored.national}
        aside="Without the country code."
      />
      <LeaderDetailFields
        dateOfBirth={state.values?.dateOfBirth ?? assistant.dateOfBirth}
        email={state.values?.email ?? assistant.email}
        servingSince={state.values?.servingSince ?? assistant.servingSince}
      />
      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onDone}>
          Back
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
      </div>
    </form>
  );
}
