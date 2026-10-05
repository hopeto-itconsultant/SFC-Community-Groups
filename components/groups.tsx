import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CommunityGroup, User } from "@/data/types";
import {
  getGroupAssistantLeaders,
  getGroupLeaders,
  getLastFellowship,
  getNextFellowship,
} from "@/lib/data-access";
import { FREQUENCY_LABELS, NOT_ASSIGNED, formatShortDate } from "@/lib/format";
import { GroupAvatar } from "./GroupAvatar";
import { ChevronRightIcon } from "./icons";
import { Badge, Card, InfoRow } from "./ui";

export function namesOrNotAssigned(people: User[]): string {
  return people.length ? people.map((p) => p.name).join(", ") : NOT_ASSIGNED;
}

function PeopleList({ people }: { people: User[] }) {
  if (!people.length) return <span className="text-slate-400">{NOT_ASSIGNED}</span>;
  return (
    <ul className="space-y-0.5">
      {people.map((p) => (
        <li key={p.id}>{p.name}</li>
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
      className="flex flex-col justify-between rounded-2xl bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      {body}
    </Link>
  );
}

function NextFellowshipBadge({ groupId }: { groupId: string }) {
  const next = getNextFellowship(groupId);
  return next ? (
    <Badge tone="green">Next {formatShortDate(next.proposedDate)}</Badge>
  ) : (
    <Badge tone="amber">Not planned</Badge>
  );
}

function lastFellowshipText(groupId: string): string {
  const last = getLastFellowship(groupId);
  return last ? `Last ${formatShortDate(last.date)}` : "No reports yet";
}

/** Small tappable card for the Admin dashboard grid. */
export function GroupMiniCard({ group }: { group: CommunityGroup }) {
  const leaders = getGroupLeaders(group);
  return (
    <Link
      href={`/groups/${group.id}`}
      className="block rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-1">
        <GroupAvatar group={group} size="sm" />
        <span className="shrink-0 whitespace-nowrap">
          <NextFellowshipBadge groupId={group.id} />
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug">{group.name}</p>
      <p className="truncate text-xs text-slate-500">{namesOrNotAssigned(leaders)}</p>
      <p className="mt-1 text-xs text-slate-500">{lastFellowshipText(group.id)}</p>
    </Link>
  );
}

function MiniInfo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="truncate text-xs text-slate-700">{children}</dd>
    </div>
  );
}

/** Larger card for the Admin Groups tab grid (two per row). */
export function GroupDetailCard({ group }: { group: CommunityGroup }) {
  const leaders = getGroupLeaders(group);
  const assistants = getGroupAssistantLeaders(group);
  const last = getLastFellowship(group.id);
  const next = getNextFellowship(group.id);

  return (
    <Link
      href={`/groups/${group.id}`}
      className="block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="relative flex aspect-[16/9] items-center justify-center bg-slate-50">
        {group.photo ? (
          <Image
            src={group.photo}
            alt=""
            fill
            sizes="(max-width: 576px) 50vw, 288px"
            className="object-cover"
          />
        ) : (
          <GroupAvatar group={group} size="lg" />
        )}
        <span className="absolute right-2 top-2 whitespace-nowrap">
          <NextFellowshipBadge groupId={group.id} />
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{group.name}</p>
        <p className="truncate text-xs text-slate-500">
          {group.category ? `${group.category} · ` : ""}
          {FREQUENCY_LABELS[group.frequency]}
        </p>
        <dl className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
          <MiniInfo label={leaders.length > 1 ? "Leaders" : "Leader"}>
            <span className={leaders.length ? "" : "text-slate-400"}>{namesOrNotAssigned(leaders)}</span>
          </MiniInfo>
          {assistants.length > 0 && (
            <MiniInfo label="Asst. Leaders">{namesOrNotAssigned(assistants)}</MiniInfo>
          )}
          <MiniInfo label="Last Fellowship">
            {last ? (
              `${formatShortDate(last.date)} · ${last.attendees} attended`
            ) : (
              <span className="text-slate-400">No reports yet</span>
            )}
          </MiniInfo>
          <MiniInfo label="Next Fellowship">
            {next ? (
              `${formatShortDate(next.proposedDate)} · ${next.location}`
            ) : (
              <span className="text-slate-400">Not planned</span>
            )}
          </MiniInfo>
        </dl>
      </div>
    </Link>
  );
}

/** One-line group summary used on the Admin dashboard; place inside a divided Card. */
export function GroupSummaryRow({ group }: { group: CommunityGroup }) {
  const leaders = getGroupLeaders(group);

  return (
    <Link
      href={`/groups/${group.id}`}
      className="flex items-center gap-3 px-3 py-2.5 active:bg-slate-50"
    >
      <GroupAvatar group={group} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-[15px] font-semibold">{group.name}</p>
          <span className="shrink-0 whitespace-nowrap">
            <NextFellowshipBadge groupId={group.id} />
          </span>
        </div>
        <p className="truncate text-xs text-slate-500">
          {namesOrNotAssigned(leaders)} · {lastFellowshipText(group.id)}
        </p>
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
    </Link>
  );
}

/** Compact tappable row used on the Admin Groups list. */
export function GroupListItem({ group }: { group: CommunityGroup }) {
  const leaders = getGroupLeaders(group);
  return (
    <Link
      href={`/groups/${group.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <GroupAvatar group={group} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold">{group.name}</p>
        <p className="truncate text-sm text-slate-500">
          {group.category ? `${group.category} · ` : ""}
          {FREQUENCY_LABELS[group.frequency]}
        </p>
        <p className={`truncate text-sm ${leaders.length ? "text-slate-700" : "text-slate-400"}`}>
          {namesOrNotAssigned(leaders)}
        </p>
      </div>
      <ChevronRightIcon className="shrink-0 text-slate-400" />
    </Link>
  );
}

/** Group information and leadership, shared by My Group and the Admin group view. */
export function GroupProfile({ group }: { group: CommunityGroup }) {
  const leaders = getGroupLeaders(group);
  const assistants = getGroupAssistantLeaders(group);

  return (
    <Card className="overflow-hidden">
      {group.photo && (
        <div className="relative -mx-4 -mt-4 mb-4 aspect-[16/9] bg-slate-100">
          <Image
            src={group.photo}
            alt={`${group.name} fellowship`}
            fill
            sizes="(max-width: 576px) 100vw, 576px"
            className="object-cover"
            priority
          />
        </div>
      )}
      <div className="flex items-center gap-4">
        {!group.photo && <GroupAvatar group={group} size="lg" />}
        <div className="min-w-0">
          <h2 className="text-xl font-bold">{group.name}</h2>
          {group.category && <p className="text-slate-500">{group.category}</p>}
        </div>
      </div>
      <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
        <InfoRow label="Fellowship">{FREQUENCY_LABELS[group.frequency]}</InfoRow>
        <InfoRow label={leaders.length > 1 ? "Leaders" : "Leader"}>
          <PeopleList people={leaders} />
        </InfoRow>
        <InfoRow label="Assistant Leaders">
          <PeopleList people={assistants} />
        </InfoRow>
      </dl>
    </Card>
  );
}
