"use client";

import { useState, useTransition } from "react";
import { Button, ConfirmCard } from "@/components/ui";
import { closeGroup } from "@/lib/actions/groups";

export function CloseGroupButton({ groupId, groupName }: { groupId: string; groupName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <>
      {error && (
        <p role="alert" className="mb-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      {confirming ? (
        <ConfirmCard
          title={`Close ${groupName}?`}
          description="The group will be hidden from the dashboard and lists. Its past reports are kept and can still be viewed."
          confirmLabel={pending ? "Closing…" : "Close group"}
          onBack={() => setConfirming(false)}
          onConfirm={() =>
            startTransition(async () => {
              const result = await closeGroup(groupId);
              if (result.error) {
                setError(result.error);
                setConfirming(false);
              }
            })
          }
        />
      ) : (
        <Button variant="danger" block onClick={() => setConfirming(true)}>
          Close group
        </Button>
      )}
    </>
  );
}
