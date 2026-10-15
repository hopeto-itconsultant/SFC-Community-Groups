"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/form";
import { LeaderDetailFields } from "@/components/LeaderDetailFields";
import { Button, Card } from "@/components/ui";
import { updateMemberDetails, type MemberDetailsState } from "@/lib/actions/people";
import type { LeaderProfile } from "@/lib/data-access";

export function LeaderDetailsForm({ leader }: { leader: LeaderProfile }) {
  const [state, action, pending] = useActionState<MemberDetailsState, FormData>(
    updateMemberDetails.bind(null, leader.id),
    {},
  );

  return (
    <Card>
      <form action={action} className="space-y-4">
        <Field label="Name" required>
          <input
            name="name"
            type="text"
            required
            defaultValue={state.values?.name ?? leader.name}
            autoComplete="off"
            autoCapitalize="words"
            className={inputClass}
          />
        </Field>
        <LeaderDetailFields
          dateOfBirth={state.values?.dateOfBirth ?? leader.dateOfBirth}
          email={state.values?.email ?? leader.email}
          servingSince={state.values?.servingSince ?? leader.servingSince}
        />
        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        {state.saved && <p className="text-sm font-medium text-emerald-700">Saved.</p>}
        <Button type="submit" block disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
      </form>
    </Card>
  );
}
