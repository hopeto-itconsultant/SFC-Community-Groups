"use client";

import { startTransition, useActionState, useState } from "react";
import type { CommunityGroup, ContactMode, CurrentUser, FollowUpReport } from "@/data/types";
import { ContactModeSelector } from "@/components/ContactModeSelector";
import { FiledBy, Field, SubmitBar, inputClass } from "@/components/form";
import { Card } from "@/components/ui";
import { createFollowUpReport } from "@/lib/actions/reports";
import type { FormState } from "@/lib/actions/types";
import { todayISO } from "@/lib/format";

export function FollowUpForm({
  user,
  group,
  initial,
  submitLabel = "SUBMIT FOLLOW-UP",
  action = createFollowUpReport,
}: {
  user: CurrentUser;
  group: CommunityGroup;
  initial?: FollowUpReport;
  submitLabel?: string;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [date, setDate] = useState(initial?.date ?? todayISO());
  const [personName, setPersonName] = useState(initial?.personName ?? "");
  const [mode, setMode] = useState<ContactMode | null>(initial?.mode ?? null);
  const [comments, setComments] = useState(initial?.comments ?? "");
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
      <Card>
        <div className="space-y-4">
          <Field label="Name of person followed up" required>
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
          <Field label="Date" required aside="Today or any earlier date">
            <input
              name="date"
              type="date"
              required
              max={todayISO()}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError(null);
              }}
              className={inputClass}
            />
          </Field>
          <fieldset>
            <legend className="mb-1.5 text-sm font-semibold text-slate-700">
              Mode of Contact
              <span className="text-red-600" aria-hidden="true">
                {" *"}
              </span>
            </legend>
            <input type="hidden" name="mode" value={mode ?? ""} />
            <ContactModeSelector
              value={mode}
              onChange={(m) => {
                setMode(m);
                setError(null);
              }}
            />
          </fieldset>
          <Field label="Comments, Prayer Requests & Testimonies">
            <textarea
              name="comments"
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Card>

      {!initial && <FiledBy user={user} group={group} />}

      <SubmitBar label={submitLabel} error={error ?? state.error} pending={pending} />
    </form>
  );
}
