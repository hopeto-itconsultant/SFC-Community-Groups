"use client";

import { startTransition, useActionState, useState } from "react";
import type { CommunityGroup, User } from "@/data/types";
import { FiledBy, Field, FormSection, SubmitBar, inputClass } from "@/components/form";
import { PhotoPicker, appendPhotos, usePhotoItems } from "@/components/PhotoPicker";
import { createFellowshipReport } from "@/lib/actions/reports";
import type { FormState } from "@/lib/actions/types";
import { REPORT_BACKDATE_DAYS, daysAgoISO, todayISO } from "@/lib/format";

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function FellowshipForm({ user, group }: { user: User; group: CommunityGroup }) {
  const { photos, setPhotos } = usePhotoItems();
  const [state, formAction, pending] = useActionState<FormState, FormData>(createFellowshipReport, {});
  const [date, setDate] = useState(todayISO);
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [firstTimers, setFirstTimers] = useState("");
  const [summary, setSummary] = useState("");
  const [comments, setComments] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDetails, setExpenseDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (date < daysAgoISO(REPORT_BACKDATE_DAYS) || date > todayISO()) {
      setError(`The fellowship date must be within the last ${REPORT_BACKDATE_DAYS} days.`);
      return;
    }
    if (toNumber(firstTimers) > toNumber(attendees)) {
      setError("First-time attendees can't be more than the number of attendees.");
      return;
    }
    setError(null);
    const formData = appendPhotos(new FormData(e.currentTarget), "photos", photos);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
      <FormSection title="Date & Location">
        <Field label="Date" hint={`Within the last ${REPORT_BACKDATE_DAYS} days`}>
          <input
            name="date"
            type="date"
            required
            value={date}
            min={daysAgoISO(REPORT_BACKDATE_DAYS)}
            max={todayISO()}
            onChange={(e) => {
              setDate(e.target.value);
              setError(null);
            }}
            className={inputClass}
          />
        </Field>
        <Field label="Location">
          <input
            name="location"
            type="text"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Church Fellowship Hall"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Attendance">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Attendees">
            <input
              name="attendees"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              required
              value={attendees}
              onChange={(e) => {
                setAttendees(e.target.value);
                setError(null);
              }}
              placeholder="0"
              className={inputClass}
            />
          </Field>
          <Field label="First-time">
            <input
              name="firstTimers"
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              min={0}
              value={firstTimers}
              onChange={(e) => {
                setFirstTimers(e.target.value);
                setError(null);
              }}
              placeholder="0"
              className={inputClass}
            />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Activity">
        <Field label="Summary of Activity">
          <textarea
            name="summary"
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="What did the group do?"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Comments">
        <Field label="Comments, Prayer Requests & Testimonies" optional>
          <textarea
            name="comments"
            rows={3}
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Expenditure">
        <Field label="Amount" optional>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center font-semibold text-slate-500">
              ₹
            </span>
            <input
              name="expenseAmount"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              placeholder="0"
              className={`${inputClass} pl-9`}
            />
          </div>
        </Field>
        <Field label="Details" optional>
          <input
            name="expenseDetails"
            type="text"
            value={expenseDetails}
            onChange={(e) => setExpenseDetails(e.target.value)}
            placeholder="e.g. Tea and snacks"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection title="Photos">
        <PhotoPicker value={photos} onChange={setPhotos} />
      </FormSection>

      <FiledBy user={user} group={group} />

      <SubmitBar label="SUBMIT REPORT" error={error ?? state.error} pending={pending} />
    </form>
  );
}
