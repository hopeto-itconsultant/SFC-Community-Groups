"use client";

import { useActionState, useEffect } from "react";
import { Field, inputClass } from "@/components/form";
import { LeaderDetailFields } from "@/components/LeaderDetailFields";
import { MobileFields } from "@/components/MobileFields";
import { Button } from "@/components/ui";
import { updateMemberDetails, type MemberDetailsState } from "@/lib/actions/people";
import { DEFAULT_COUNTRY_ISO, splitMobile } from "@/lib/countries";
import type { AssistantLeader } from "@/lib/data-access";

export function AssistantDetailsForm({
  assistant,
  onDone,
}: {
  assistant: AssistantLeader;
  onDone: () => void;
}) {
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
        required={Boolean(assistant.mobile)}
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
