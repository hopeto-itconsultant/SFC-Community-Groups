"use client";

import { useState, useTransition } from "react";
import type { ReportType } from "@/data/types";
import { Button, ConfirmCard } from "@/components/ui";
import { deleteReport } from "@/lib/actions/reports";
import { REPORT_TYPE_LABELS } from "@/lib/format";

const CONFIRM: Record<ReportType, { title: string; description: string }> = {
  fellowship: {
    title: "Delete this fellowship report?",
    description:
      "This permanently removes the report and its photos. This cannot be undone.",
  },
  "follow-up": {
    title: "Delete this follow-up?",
    description: "This permanently removes the follow-up. This cannot be undone.",
  },
  "next-fellowship": {
    title: "Delete this fellowship plan?",
    description: "This permanently removes the plan. This cannot be undone.",
  },
};

export function DeleteReportButton({
  reportId,
  reportType,
}: {
  reportId: string;
  reportType: ReportType;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const copy = CONFIRM[reportType];

  return (
    <div className="mt-8 border-t border-slate-200 pt-4">
      {error && (
        <p role="alert" className="mb-2 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
      {confirming ? (
        <ConfirmCard
          title={copy.title}
          description={copy.description}
          confirmLabel={pending ? "Deleting…" : "Delete permanently"}
          onBack={() => setConfirming(false)}
          onConfirm={() =>
            startTransition(async () => {
              const result = await deleteReport(reportId);
              if (result?.error) {
                setError(result.error);
                setConfirming(false);
              }
            })
          }
        />
      ) : (
        <Button variant="danger" block onClick={() => setConfirming(true)}>
          Delete {REPORT_TYPE_LABELS[reportType].toLowerCase()}
        </Button>
      )}
    </div>
  );
}
