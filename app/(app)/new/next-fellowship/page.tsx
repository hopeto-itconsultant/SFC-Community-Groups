"use client";

import { useState } from "react";
import type { NextFellowship } from "@/data/types";
import { LEADER_ROLES } from "@/components/form";
import { NextFellowshipForm } from "@/components/NextFellowshipForm";
import { PageHeader } from "@/components/PageHeader";
import { RoleGate } from "@/components/RoleGate";
import { SubmittedView } from "@/components/SubmittedView";
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
    <>
      <PageHeader title="Next Fellowship" subtitle={group.name} backHref="/home" />
      <NextFellowshipForm
        key={formKey}
        user={user}
        group={group}
        submitLabel="SAVE NEXT FELLOWSHIP"
        onSubmit={(report) => {
          setSubmitted(report);
          window.scrollTo(0, 0);
        }}
      />
    </>
  );
}
