"use client";

import { useState } from "react";
import type { CommunityGroup, ContactMode, FollowUpReport, User } from "@/data/types";
import { ContactModeSelector } from "@/components/ContactModeSelector";
import { FiledBy, Field, FormSection, LEADER_ROLES, SubmitBar, inputClass } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { SubmittedView } from "@/components/SubmittedView";
import { nowLocalISO, todayISO } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

export default function NewFollowUpPage() {
  return (
    <RoleGate allow={LEADER_ROLES}>
      <FollowUpFlow />
    </RoleGate>
  );
}

function FollowUpFlow() {
  const { user, group } = useCurrentUser();
  const [submitted, setSubmitted] = useState<FollowUpReport | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!group) return null;

  if (submitted) {
    return (
      <SubmittedView
        report={submitted}
        title="Follow-up submitted"
        anotherLabel="New Follow-up"
        onAnother={() => {
          setSubmitted(null);
          setFormKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <FollowUpForm
      key={formKey}
      user={user}
      group={group}
      onSubmit={(report) => {
        setSubmitted(report);
        window.scrollTo(0, 0);
      }}
    />
  );
}

function FollowUpForm({
  user,
  group,
  onSubmit,
}: {
  user: User;
  group: CommunityGroup;
  onSubmit: (report: FollowUpReport) => void;
}) {
  const [personName, setPersonName] = useState("");
  const [mode, setMode] = useState<ContactMode | null>(null);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!mode) {
      setError("Please choose how you contacted them.");
      return;
    }
    onSubmit({
      id: `draft-${Date.now()}`,
      type: "follow-up",
      groupId: group.id,
      filedBy: user.id,
      createdAt: nowLocalISO(),
      date: todayISO(),
      personName: personName.trim(),
      mode,
      comments: comments.trim(),
    });
  }

  return (
    <>
      <PageHeader title="Follow-up Report" subtitle={group.name} backHref="/home" />
      <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
        <FormSection title="Who was followed up?">
          <Field label="Name of person followed up">
            <input
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
              rows={4}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className={inputClass}
            />
          </Field>
        </FormSection>

        <FiledBy user={user} group={group} />

        <SubmitBar label="SUBMIT FOLLOW-UP" error={error} />
      </form>
    </>
  );
}
