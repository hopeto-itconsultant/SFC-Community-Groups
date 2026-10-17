"use client";

import { startTransition, useActionState, useState } from "react";
import type { CommunityGroup, CurrentUser, NextFellowship } from "@/data/types";
import type { FormState } from "@/lib/actions/types";
import { FREQUENCY_LABELS, timeInputValue, todayISO } from "@/lib/format";
import { HalfHourTimeInput } from "./HalfHourTimeInput";
import { DateTimeField, FiledBy, Field, FormSection, SubmitBar, dateTimeControlClass, inputClass } from "./form";

/** New or edit form for a next-fellowship plan; pass `initial` to edit an existing plan. */
export function NextFellowshipForm({
  user,
  group,
  initial,
  submitLabel,
  action,
}: {
  user: CurrentUser;
  group: CommunityGroup;
  initial?: NextFellowship;
  submitLabel: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const [proposedDate, setProposedDate] = useState(initial?.proposedDate ?? "");
  const [proposedTime, setProposedTime] = useState(timeInputValue(initial?.time));
  const [location, setLocation] = useState(initial?.location ?? "");
  const [activity, setActivity] = useState(initial?.activity ?? "");
  const [goals, setGoals] = useState(initial?.goals ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!proposedDate) {
      setError("Choose a date.");
      return;
    }
    if (!proposedTime) {
      setError("Choose a time.");
      return;
    }
    if (!location.trim()) {
      setError("Enter the location.");
      return;
    }
    if (!goals.trim()) {
      setError("Enter the goals.");
      return;
    }
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
      <FormSection title="When & Where">
        <DateTimeField
          label="Proposed Date & Time:"
          hint={group.frequency && `${group.name} meets: ${FREQUENCY_LABELS[group.frequency]}`}
          date={
            <input
              name="proposedDate"
              type="date"
              required
              aria-label="Proposed date"
              value={proposedDate}
              min={todayISO()}
              onChange={(e) => {
                setProposedDate(e.target.value);
                setError(null);
              }}
              className={dateTimeControlClass}
            />
          }
          time={
            <HalfHourTimeInput
              name="time"
              required
              aria-label="Proposed time"
              value={proposedTime}
              onChange={(next) => {
                setProposedTime(next);
                setError(null);
              }}
            />
          }
        />
        <Field label="Location" required>
          <input
            name="location"
            type="text"
            required
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setError(null);
            }}
            placeholder="e.g. Church Fellowship Hall"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Plan">
        <Field label="Activity & Discussion">
          <textarea
            name="activity"
            rows={3}
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="What will the group do?"
            className={inputClass}
          />
        </Field>
        <Field label="Goals" required>
          <textarea
            name="goals"
            rows={3}
            required
            value={goals}
            onChange={(e) => {
              setGoals(e.target.value);
              setError(null);
            }}
            className={inputClass}
          />
        </Field>
      </FormSection>

      {!initial && <FiledBy user={user} group={group} />}

      <SubmitBar label={submitLabel} error={error ?? state.error} pending={pending} />
    </form>
  );
}
