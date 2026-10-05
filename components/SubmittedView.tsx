import type { Report } from "@/data/types";
import { CheckIcon } from "./icons";
import { PageHeader } from "./PageHeader";
import { ReportDetail } from "./reports";
import { Button, LinkButton } from "./ui";

export function SubmittedView({
  report,
  title,
  anotherLabel,
  onAnother,
}: {
  report: Report;
  title: string;
  anotherLabel: string;
  onAnother: () => void;
}) {
  return (
    <>
      <PageHeader title="Submitted" backHref="/home" />
      <div className="p-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="mb-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-800 ring-1 ring-emerald-200">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
            <CheckIcon />
          </span>
          <div>
            <p className="font-bold">{title}</p>
            <p className="text-sm text-emerald-700">Prototype: this entry is shown here but not saved.</p>
          </div>
        </div>

        <ReportDetail report={report} />

        <div className="mt-6 space-y-2">
          <LinkButton href="/home" size="lg" block>
            Back to Home
          </LinkButton>
          <Button variant="secondary" size="lg" block onClick={onAnother}>
            {anotherLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
