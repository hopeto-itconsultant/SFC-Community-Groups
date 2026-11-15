import type { ComponentProps } from "react";
import Link from "next/link";
import { AssistantLeaders } from "@/app/(app)/people/[id]/AssistantLeaders";
import { GroupProfile } from "@/components/groups";
import { DateCalendarIcon, MapPinIcon } from "@/components/icons";
import { PageHeader } from "@/components/PageHeader";
import { SavedBanner } from "@/components/SavedBanner";
import { EmptyState, LinkButton, SectionTitle } from "@/components/ui";
import { formatDateTimeDay } from "@/lib/format";
import type { MyGroupModel } from "@/lib/page-models";

export function MyGroupScreen({
  model,
  assistants,
}: {
  model: MyGroupModel;
  /** Omitted from the on-device cache. Contact details and the edit form stay on the server render. */
  assistants?: ComponentProps<typeof AssistantLeaders>["assistants"];
}) {
  return (
    <>
      <PageHeader title="My Group" />
      <div className="p-4">
        {model.savedTitle && <SavedBanner title={model.savedTitle} />}
        <GroupProfile
          group={model.group}
          leaders={model.leaders}
          assistants={model.assistants}
          hideAssistants={model.hideAssistants}
        />
        <LinkButton href={`/groups/${model.group.id}/edit`} variant="secondary" block className="mt-3">
          Edit group profile
        </LinkButton>

        {assistants && <AssistantLeaders assistants={assistants} showGroups={false} />}

        <SectionTitle>Next Fellowship</SectionTitle>
        {model.next ? (
          <Link
            href={`/reports/${model.next.id}`}
            prefetch={false}
            className="cv-item block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
          >
            <div className="flex items-center gap-2 text-lg font-bold">
              <DateCalendarIcon date={model.next.date} />
              <span className="min-w-0">{formatDateTimeDay(model.next.date, model.next.time)}</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-slate-600">
              <MapPinIcon width={18} height={18} className="shrink-0 text-slate-400" />
              <span className="truncate">{model.next.location}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-slate-700">{model.next.activity}</p>
          </Link>
        ) : (
          <EmptyState title="No fellowship planned yet" />
        )}

        <LinkButton href="/reports" variant="secondary" block className="mt-4">
          View group reports
        </LinkButton>
      </div>
    </>
  );
}
