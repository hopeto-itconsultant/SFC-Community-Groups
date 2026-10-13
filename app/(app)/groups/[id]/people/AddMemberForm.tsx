"use client";

import { useActionState } from "react";
import { Field, inputClass } from "@/components/form";
import { Button, Card } from "@/components/ui";
import { type AddMemberState, addMember } from "@/lib/actions/people";

export function AddMemberForm({ groupId }: { groupId: string }) {
  const [state, action, pending] = useActionState<AddMemberState, FormData>(addMember.bind(null, groupId), {});

  return (
    <Card>
      <form action={action} className="space-y-4">
        <Field label="Name">
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
        <Field label="Role">
          <select name="role" defaultValue={state.values?.role ?? "leader"} className={inputClass}>
            <option value="leader">Leader</option>
            <option value="asst-leader">Assistant Leader</option>
          </select>
        </Field>
        <Field label="Mobile number" optional hint="Can also be added later, when setting up their login.">
          <input
            name="mobile"
            type="tel"
            inputMode="tel"
            defaultValue={state.values?.mobile}
            placeholder="e.g. 9876543210"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
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
