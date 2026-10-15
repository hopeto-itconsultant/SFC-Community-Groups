"use client";

import { useActionState } from "react";
import { ChoiceField, Field, GROUP_ROLE_OPTIONS, inputClass } from "@/components/form";
import { LeaderDetailFields } from "@/components/LeaderDetailFields";
import { MobileFields } from "@/components/MobileFields";
import { Button, Card } from "@/components/ui";
import { type AddMemberState, addMember } from "@/lib/actions/people";
import { DEFAULT_COUNTRY_ISO } from "@/lib/countries";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState<AddMemberState, FormData>(addMember.bind(null, groupId), {});

  return (
    <Card>
      <form action={action} className="space-y-4">
        <Field label="Name" required>
          <input
            name="name"
            type="text"
            required
            defaultValue={state.values?.name}
            placeholder="e.g. Bro. David"
            autoComplete="off"
            autoCapitalize="words"
            className={inputClass}
          />
        </Field>
        <ChoiceField
          label="Role"
          name="role"
          required
          options={GROUP_ROLE_OPTIONS}
          defaultValue={state.values?.role ?? "leader"}
        />
        <MobileFields
          country={state.values?.country ?? DEFAULT_COUNTRY_ISO}
          mobile={state.values?.mobile}
          hint="Without the country code. Can also be added later, when setting up their login."
        />
        <LeaderDetailFields
          dateOfBirth={state.values?.dateOfBirth}
          email={state.values?.email}
          servingSince={state.values?.servingSince}
        />
        {state.error && (
          <p role="alert" className="text-sm font-medium text-red-600">
            {state.error}
          </p>
        )}
        <Button type="submit" block disabled={pending}>
          {pending ? "Adding…" : "Add to group"}
        </Button>
      </form>
    </Card>
  );
}
