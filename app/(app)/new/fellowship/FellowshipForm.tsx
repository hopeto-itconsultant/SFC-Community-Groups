"use client";

import { startTransition, useActionState, useState } from "react";
import type { CommunityGroup, CurrentUser, FellowshipReport, NextFellowship } from "@/data/types";
import { DateTimeField, FiledBy, Field, SubmitBar, dateTimeControlClass, inputClass } from "@/components/form";
import { PhotoPicker, appendKeptPhotos, appendPhotos, storedPhotoItems, usePhotoItems } from "@/components/PhotoPicker";
import { createFellowshipReport } from "@/lib/actions/reports";
import type { FormState } from "@/lib/actions/types";
import { formatDateTime, timeInputValue, todayISO } from "@/lib/format";

const OTHER_DATE = "other";

function plannedAside(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text ? `Planned: ${text}` : undefined;
}

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

export function FellowshipForm({
  user,
  group,
  plans = [],
  initial,
  submitLabel = "SUBMIT REPORT",
  action = createFellowshipReport,
}: {
  user: CurrentUser;
  group: CommunityGroup;
  plans?: NextFellowship[];
  initial?: FellowshipReport;
  submitLabel?: string;
  action?: (prev: FormState, formData: FormData) => Promise<FormState>;
}) {
  const editing = initial != null;
  const { photos, setPhotos } = usePhotoItems(storedPhotoItems(initial?.photos ?? []));
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});
  const [choice, setChoice] = useState(plans[0]?.proposedDate ?? OTHER_DATE);
  const [manualDate, setManualDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(timeInputValue(initial?.time ?? plans[0]?.time));
  const date = editing || choice === OTHER_DATE ? manualDate : choice;
  const plan = editing ? undefined : plans.find((item) => item.proposedDate === date);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [attendees, setAttendees] = useState(initial ? String(initial.attendees) : "");
  const [firstTimers, setFirstTimers] = useState(initial ? String(initial.firstTimers) : "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [comments, setComments] = useState(initial?.comments ?? "");
  const [expenseAmount, setExpenseAmount] = useState(
    initial?.expenseAmount != null ? String(initial.expenseAmount) : "",
  );
  const [expenseDetails, setExpenseDetails] = useState(initial?.expenseDetails ?? "");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date) {
      setError("Choose a date.");
      return;
    }
    if (!time) {
      setError("Choose a time.");
      return;
    }
    if (date > todayISO()) {
      setError("The fellowship date can't be in the future.");
      return;
    }
    if (toNumber(firstTimers) > toNumber(attendees)) {
      setError("First-time attendees can't be more than the number of attendees.");
      return;
    }
    setError(null);
    const formData = appendKeptPhotos(appendPhotos(new FormData(e.currentTarget), "photos", photos), photos);
    startTransition(() => formAction(formData));
  }

  function choosePlan(value: string) {
    setChoice(value);
    const selected = plans.find((item) => item.proposedDate === value);
    if (selected) setTime(timeInputValue(selected.time));
    setError(null);
  }

  const timeInput = (
    <input
      name="time"
      type="time"
      required
      aria-label="Time"
      value={time}
      onChange={(e) => {
        setTime(e.target.value);
        setError(null);
      }}
      className={dateTimeControlClass}
    />
  );

  const planSelect = (
    <select
      value={choice}
      aria-label="Date"
      onChange={(e) => choosePlan(e.target.value)}
      className={dateTimeControlClass}
    >
      {plans.map((item) => (
        <option key={item.id} value={item.proposedDate}>
          {formatDateTime(item.proposedDate, item.time)}
        </option>
      ))}
      <option value={OTHER_DATE}>Other date</option>
    </select>
  );

  const manualDateInput = (
    <input
      name="date"
      type="date"
      required
      aria-label="Date"
      value={manualDate}
      max={todayISO()}
      onChange={(e) => {
        setManualDate(e.target.value);
        setError(null);
      }}
      className={dateTimeControlClass}
    />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 pt-4">
      {editing ? (
        <DateTimeField label="Date & Time" aside="Today or any earlier date" date={manualDateInput} time={timeInput} />
      ) : choice === OTHER_DATE ? (
        <DateTimeField
          label="Date & Time"
          aside={
            plans.length > 0 ? (
              <button
                type="button"
                onClick={() => choosePlan(plans[0].proposedDate)}
                className="font-semibold text-brand-700"
              >
                Planned dates
              </button>
            ) : (
              "Today or any earlier date"
            )
          }
          date={manualDateInput}
          time={timeInput}
        />
      ) : (
        <>
          <DateTimeField label="Date & Time" date={planSelect} time={timeInput} />
          <input type="hidden" name="date" value={choice} />
        </>
      )}
      <Field label="Location" required aside={plannedAside(plan?.location)}>
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

      <div className="grid grid-cols-2 gap-3">
        <Field label="Attendees" required>
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

      <Field label="Summary of Activity" aside={plannedAside(plan?.activity)}>
        <textarea
          name="summary"
          rows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="What did the group do?"
          className={inputClass}
        />
      </Field>

      <Field label="Comments, Prayer Requests & Testimonies" aside={plannedAside(plan?.goals)}>
        <textarea
          name="comments"
          rows={3}
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2 min-w-0">
          <Field label="Amount">
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
        </div>
        <div className="col-span-3 min-w-0">
          <Field label="Details">
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
        </div>
      </div>

      <PhotoPicker value={photos} onChange={setPhotos} />

      {!editing && <FiledBy user={user} group={group} compact />}

      <SubmitBar label={submitLabel} error={error ?? state.error} pending={pending} />
    </form>
  );
}
