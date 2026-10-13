"use client";

import { startTransition, useActionState, useState } from "react";
import type { CommunityGroup, ContactMode, User } from "@/data/types";
import { ContactModeSelector } from "@/components/ContactModeSelector";
import { FiledBy, Field, FormSection, SubmitBar, inputClass } from "@/components/form";
import { createFollowUpReport } from "@/lib/actions/reports";
import type { FormState } from "@/lib/actions/types";

export function FollowUpForm({ user, group }: { user: User; group: CommunityGroup }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createFollowUpReport, {});
  const [personName, setPersonName] = useState("");
  const [mode, setMode] = useState<ContactMode | null>(null);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mode) {
      setError("Please choose how you contacted them.");
      return;
    }
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
      <FormSection title="Who was followed up?">
        <Field label="Name of person followed up">
          <input
            name="personName"
            type="text"
            required
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="e.g. David"
            autoComplete="off"
            autoCapitalize="words"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Mode of Contact">
        <input type="hidden" name="mode" value={mode ?? ""} />
        <ContactModeSelector
          value={mode}
          onChange={(m) => {
            setMode(m);
            setError(null);
          }}
        />
      </FormSection>

      <FormSection title="Comments">
        <Field label="Comments, Prayer Requests & Testimonies" optional>
          <textarea
            name="comments"
            rows={4}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FiledBy user={user} group={group} />

      <SubmitBar label="SUBMIT FOLLOW-UP" error={error ?? state.error} pending={pending} />
    </form>
  );
}
