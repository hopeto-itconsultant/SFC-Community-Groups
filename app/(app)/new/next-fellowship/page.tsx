"use client";

import { useState } from "react";
import type { CommunityGroup, NextFellowship, User } from "@/data/types";
import { FiledBy, Field, FormSection, LEADER_ROLES, SubmitBar, inputClass } from "@/components/form";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { SubmittedView } from "@/components/SubmittedView";
import { FREQUENCY_LABELS, nowLocalISO, todayISO } from "@/lib/format";
import { useCurrentUser } from "@/lib/session";

export default function NewNextFellowshipPage() {
  return (
    <RoleGate allow={LEADER_ROLES}>
      <NextFellowshipFlow />
    </RoleGate>
  );
}

function NextFellowshipFlow() {
  const { user, group } = useCurrentUser();
  const [submitted, setSubmitted] = useState<NextFellowship | null>(null);
  const [formKey, setFormKey] = useState(0);

  if (!group) return null;

  if (submitted) {
    return (
      <SubmittedView
        report={submitted}
        title="Next fellowship saved"
        anotherLabel="Plan another"
        onAnother={() => {
          setSubmitted(null);
          setFormKey((k) => k + 1);
        }}
      />
    );
  }

  return (
    <NextFellowshipForm
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

function NextFellowshipForm({
  user,
  group,
  onSubmit,
}: {
  user: User;
  group: CommunityGroup;
  onSubmit: (report: NextFellowship) => void;
}) {
  const [proposedDate, setProposedDate] = useState("");
  const [location, setLocation] = useState("");
  const [activity, setActivity] = useState("");
  const [goals, setGoals] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      id: `draft-${Date.now()}`,
      type: "next-fellowship",
      groupId: group.id,
      filedBy: user.id,
      createdAt: nowLocalISO(),
      proposedDate,
      location: location.trim(),
      activity: activity.trim(),
      goals: goals.trim(),
    });
  }

  return (
    <>
      <PageHeader title="Next Fellowship" subtitle={group.name} backHref="/home" />
      <form onSubmit={handleSubmit} className="space-y-3 px-4 pt-4">
        <FormSection title="When & Where">
          <Field label="Proposed Date" hint={`${group.name} meets: ${FREQUENCY_LABELS[group.frequency]}`}>
            <input
              type="date"
              required
              value={proposedDate}
              min={todayISO()}
              onChange={(e) => setProposedDate(e.target.value)}
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

        <FormSection title="Plan">
          <Field label="Activity & Discussion">
            <textarea
              rows={3}
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="What will the group do?"
              className={inputClass}
            />
          </Field>
          <Field label="Goals" optional>
            <textarea
              rows={3}
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className={inputClass}
            />
          </Field>
        </FormSection>

        <FiledBy user={user} group={group} />

        <SubmitBar label="SAVE NEXT FELLOWSHIP" />
      </form>
    </>
  );
}
