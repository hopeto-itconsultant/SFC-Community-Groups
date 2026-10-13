"use client";

import { useState, useTransition } from "react";
import { Button, ConfirmCard, LinkButton } from "@/components/ui";
import { cancelPlan } from "@/lib/actions/reports";

export function PlanActions({ planId }: { planId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="mt-4">
        <ConfirmCard
          title="Cancel this fellowship plan?"
          description="The plan will no longer show as upcoming. It stays in the group's reports."
          confirmLabel={pending ? "Cancelling…" : "Cancel plan"}
          onBack={() => setConfirming(false)}
          onConfirm={() =>
            startTransition(async () => {
              const result = await cancelPlan(planId);
              if (result.error) {
                setError(result.error);
                setConfirming(false);
              }
            })
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-4">
      {error && (
        <p role="alert" className="mb-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        <LinkButton href={`/reports/${planId}/edit`} variant="secondary">
          Edit plan
        </LinkButton>
        <Button variant="danger" onClick={() => setConfirming(true)}>
          Cancel plan
        </Button>
      </div>
    </div>
  );
}
