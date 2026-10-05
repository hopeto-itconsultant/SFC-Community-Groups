"use client";

import { useState } from "react";
import type { CommunityGroup, FellowshipReport, User } from "@/data/types";
import { FiledBy, Field, FormSection, LEADER_ROLES, SubmitBar, inputClass } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { PhotoPicker, usePhotoItems, type PhotoItem } from "@/components/PhotoPicker";
import { RoleGate } from "@/components/RoleGate";
import { SubmittedView } from "@/components/SubmittedView";
import { REPORT_BACKDATE_DAYS, daysAgoISO, nowLocalISO, todayISO } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

export default function NewFellowshipPage() {
  return (
    <RoleGate allow={LEADER_ROLES}>
      <FellowshipFlow />
    </RoleGate>
  );
}

function FellowshipFlow() {
  const { user, group } = useCurrentUser();
  const { photos, setPhotos, clear } = usePhotoItems();
  const [submitted, setSubmitted] = useState<FellowshipReport | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!group) return null;

  if (submitted) {
    return (
      <SubmittedView
        report={submitted}
        title="Fellowship report submitted"
        anotherLabel="New Fellowship Report"
        onAnother={() => {
          clear();
          setSubmitted(null);
          setFormKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <FellowshipForm
      key={formKey}
      user={user}
      group={group}
      photos={photos}
      onPhotosChange={setPhotos}
      onSubmit={(report) => {
        setSubmitted(report);
        window.scrollTo(0, 0);
      }}
    />
  );
}

function toNumber(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

function FellowshipForm({
  user,
  group,
  photos,
  onPhotosChange,
  onSubmit,
}: {
  user: User;
  group: CommunityGroup;
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  onSubmit: (report: FellowshipReport) => void;
}) {
  const [date, setDate] = useState(todayISO);
  const [location, setLocation] = useState("");
  const [attendees, setAttendees] = useState("");
  const [firstTimers, setFirstTimers] = useState("");
  const [summary, setSummary] = useState("");
  const [comments, setComments] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDetails, setExpenseDetails] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (date < daysAgoISO(REPORT_BACKDATE_DAYS) || date > todayISO()) {
      setError(`The fellowship date must be within the last ${REPORT_BACKDATE_DAYS} days.`);
      return;
    }
    const attendeeCount = toNumber(attendees);
    const firstTimerCount = toNumber(firstTimers);
    if (firstTimerCount > attendeeCount) {
      setError("First-time attendees can't be more than the number of attendees.");
      return;
    }
    const amount = Number(expenseAmount);
    onSubmit({
      id: `draft-${Date.now()}`,
      type: "fellowship",
      groupId: group.id,
      filedBy: user.id,
      createdAt: nowLocalISO(),
      date,
      location: location.trim(),
      attendees: attendeeCount,
      firstTimers: firstTimerCount,
      summary: summary.trim(),
      comments: comments.trim(),
      expenseAmount: amount > 0 ? amount : undefined,
      expenseDetails: expenseDetails.trim() || undefined,
      photos: photos.map((p) => p.previewUrl),
    });
  }

  return (
    <>
      <PageHeader title="Fellowship Report" subtitle={group.name} backHref="/home" />
      <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
        <FormSection title="Date & Location">
          <Field label="Date" hint={`Within the last ${REPORT_BACKDATE_DAYS} days`}>
            <input
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
          <PhotoPicker value={photos} onChange={onPhotosChange} />
        </FormSection>

        <FiledBy user={user} group={group} />

        <SubmitBar label="SUBMIT REPORT" error={error} />
      </form>
    </>
  );
}
