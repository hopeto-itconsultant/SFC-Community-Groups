import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CommunityGroup } from "@/data/types";
import { FREQUENCY_LABELS, NOT_ASSIGNED, formatDate } from "@/lib/format";
import { isConfirmedLocation, shortLocation } from "@/lib/location";
import type { GroupCardModel } from "@/lib/page-models";
import { photoVariant } from "@/lib/photos";
import { GroupAvatar } from "./GroupAvatar";
import { GroupHeroPhoto } from "./GroupHeroPhoto";
import { ChevronRightIcon, MapPinIcon } from "./icons";
import { Badge, Card, InfoRow } from "./ui";

function PeopleList({ names }: { names: string[] }) {
  if (!names.length) return <span className="text-slate-400">{NOT_ASSIGNED}</span>;
  return (
    <ul className="space-y-0.5">
      {names.map((name) => (
        <li key={name}>{name}</li>
      ))}
    </ul>
  );
}

export function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-1">
        <p className="text-xs font-medium leading-tight text-slate-500">{label}</p>
        {href && <ChevronRightIcon width={14} height={14} className="shrink-0 text-slate-400" />}
      </div>
      <p className="mt-1 text-2xl font-bold text-brand-700">{value}</p>
    </>
  );

  if (!href) return <Card className="flex flex-col justify-between px-3 py-2.5">{body}</Card>;
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex flex-col justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      {body}
    </Link>
  );
}

export function ClosedBadge() {
  return <Badge tone="slate">Closed</Badge>;
}

/** Meeting place under an upcoming date. One line; nothing when the place is blank or unconfirmed. */
export function MeetingLocation({
  location,
  className = "",
}: {
  location?: string | null;
  className?: string;
}) {
  if (!isConfirmedLocation(location)) return null;
  const full = location.trim();
  return (
    <span className={`flex w-full min-w-0 items-center gap-1 overflow-hidden text-xs text-slate-500 ${className}`}>
      <MapPinIcon width={12} height={12} className="shrink-0 text-slate-400" />
      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={full}>
        {shortLocation(full)}
      </span>
    </span>
  );
}

function NextWhen({
  when,
  location,
  compact = false,
}: {
  when?: string;
  location?: string;
  compact?: boolean;
}) {
  if (!when) return null;
  if (compact) {
    return (
      <div className="min-w-0 overflow-hidden">
        <p className="whitespace-nowrap text-xs font-semibold text-emerald-700">{when}</p>
        <MeetingLocation location={location} className="mt-0.5" />
      </div>
    );
  }
  return (
    <div className="mt-1 min-w-0 overflow-hidden">
      <Badge tone="green">Next {when}</Badge>
      <MeetingLocation location={location} className="mt-1" />
    </div>
  );
}

/** Small tappable card for the Admin dashboard grid (two per row). */
export function GroupMiniCard({ group }: { group: GroupCardModel }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      prefetch={false}
      className="cv-item flex h-full flex-col gap-1.5 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-start gap-2">
        <GroupAvatar group={group} size="xs" />
        <div className="min-w-0 flex-1 space-y-0.5 overflow-hidden">
          <p className="break-words text-sm font-semibold leading-snug">{group.name}</p>
          <p className={`break-words text-xs leading-snug ${group.hasLeaders ? "text-slate-600" : "text-slate-400"}`}>
            {group.leadersLabel}
          </p>
          {group.closed ? (
            <ClosedBadge />
          ) : (
            <NextWhen when={group.nextWhen} location={group.nextLocation} compact />
          )}
        </div>
      </div>
    </Link>
  );
}

function MiniInfo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="break-words text-xs text-slate-700">{children}</dd>
    </div>
  );
}

/** Larger card for the Admin Groups tab grid (two per row). */
export function GroupDetailCard({ group }: { group: GroupCardModel }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      prefetch={false}
      className="cv-item block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="relative flex aspect-[16/9] items-center justify-center bg-slate-50">
        {group.photo ? (
          <Image
            src={photoVariant(group.photo, 384)}
            alt=""
            fill
            sizes="(max-width: 576px) 50vw, 288px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <GroupAvatar group={group} size="lg" />
        )}
        {group.closed && (
          <span className="absolute right-2 top-2 whitespace-nowrap">
            <ClosedBadge />
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="break-words text-sm font-semibold leading-snug">{group.name}</p>
        {group.category && <p className="break-words text-xs text-slate-500">{group.category}</p>}
        <dl className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
          <MiniInfo label={group.leaderCount > 1 ? "Leaders" : "Leader"}>
            <span className={group.hasLeaders ? "" : "text-slate-400"}>{group.leadersLabel}</span>
          </MiniInfo>
          {group.hasAssistants && <MiniInfo label="Asst. Leaders">{group.assistantsLabel}</MiniInfo>}
        </dl>
      </div>
    </Link>
  );
}

/** Group summary used on the Admin dashboard; place inside a divided Card. */
export function GroupSummaryRow({ group }: { group: GroupCardModel }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      prefetch={false}
      className="flex items-center gap-3 px-3 py-2.5 active:bg-slate-50"
    >
      <GroupAvatar group={group} size="sm" />
      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="break-words text-[15px] font-semibold">{group.name}</p>
        <p className={`break-words text-xs ${group.hasLeaders ? "text-slate-500" : "text-slate-400"}`}>
          {group.leadersLabel}
        </p>
        {group.closed ? (
          <span className="mt-1 inline-flex">
            <ClosedBadge />
          </span>
        ) : (
          <NextWhen when={group.nextWhen} location={group.nextLocation} />
        )}
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
    </Link>
  );
}

/** Compact tappable row used on the Admin Groups list. */
export function GroupListItem({ group }: { group: GroupCardModel }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      prefetch={false}
      className="cv-item flex items-start gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <GroupAvatar group={group} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 break-words text-sm">
            <span className="font-bold">{group.name}</span>
            {group.category && <span className="text-slate-500"> · {group.category}</span>}
            <span className={group.hasLeaders ? "text-slate-700" : "text-slate-400"}>
              {" · "}
              {group.leadersLabel}
            </span>
          </p>
          {group.closed && (
            <span className="shrink-0">
              <ClosedBadge />
            </span>
          )}
        </div>
        <p className={`break-words text-sm ${group.hasAssistants ? "text-slate-500" : "text-slate-400"}`}>
          {group.assistantsLabel}
        </p>
      </div>
      <ChevronRightIcon className="mt-0.5 shrink-0 text-slate-400" />
    </Link>
  );
}

type GroupProfileSource = Pick<
  CommunityGroup,
  "id" | "name" | "category" | "frequency" | "photo" | "status" | "closedAt"
>;

/** Group information and leadership, shared by My Group and the Admin group view. */
export function GroupProfile({
  group,
  leaders,
  assistants = [],
  hideAssistants = false,
}: {
  group: GroupProfileSource;
  leaders: string[];
  assistants?: string[];
  hideAssistants?: boolean;
}) {
  const closed = group.status === "closed";

  return (
    <Card className="overflow-hidden">
      {group.photo && <GroupHeroPhoto src={group.photo} name={group.name} />}
      <div className="flex items-center gap-4">
        {!group.photo && <GroupAvatar group={group} size="lg" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{group.name}</h2>
          {group.category && <p className="text-slate-500">{group.category}</p>}
        </div>
        {closed && <ClosedBadge />}
      </div>
      <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
        {closed && group.closedAt && <InfoRow label="Closed">{formatDate(group.closedAt)}</InfoRow>}
        {group.frequency && <InfoRow label="Fellowship">{FREQUENCY_LABELS[group.frequency]}</InfoRow>}
        <InfoRow label={leaders.length > 1 ? "Leaders" : "Leader"}>
          <PeopleList names={leaders} />
        </InfoRow>
        {!hideAssistants && (
          <InfoRow label="Assistant Leaders">
            <PeopleList names={assistants} />
          </InfoRow>
        )}
      </dl>
    </Card>
  );
}
