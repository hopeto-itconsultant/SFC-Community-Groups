import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { CommunityGroup, User } from "@/data/types";
import { getNameDisplay } from "@/lib/auth";
import { getGroupAssistantLeaders, getGroupLeaders, getNextFellowship } from "@/lib/data-access";
import { FREQUENCY_LABELS, NOT_ASSIGNED, formatDate, formatShortDateTimeDay } from "@/lib/format";
import { photoVariant } from "@/lib/photos";
import { isGroupClosed } from "@/lib/report-rules";
import { GroupAvatar } from "./GroupAvatar";
import { GroupHeroPhoto } from "./GroupHeroPhoto";
import { ChevronRightIcon } from "./icons";
import { Badge, Card, InfoRow } from "./ui";

export function namesOrNotAssigned(people: User[], shown: (name: string) => string): string {
  return people.length ? people.map((p) => shown(p.name)).join(", ") : NOT_ASSIGNED;
}

function PeopleList({ people, shown }: { people: User[]; shown: (name: string) => string }) {
  if (!people.length) return <span className="text-slate-400">{NOT_ASSIGNED}</span>;
  return (
    <ul className="space-y-0.5">
      {people.map((p) => (
        <li key={p.id}>{shown(p.name)}</li>
      ))}
    </ul>
  );
}

export function ClosedBadge() {
  return <Badge tone="slate">Closed</Badge>;
}

async function NextFellowshipBadge({ group, compact = false }: { group: CommunityGroup; compact?: boolean }) {
  if (isGroupClosed(group)) {
    return (
      <span className="shrink-0 self-start whitespace-nowrap">
        <ClosedBadge />
      </span>
    );
  }
  const next = await getNextFellowship(group.id);
  if (!next) return null;
  const when = formatShortDateTimeDay(next.proposedDate, next.time);
  if (compact) {
    return <p className="whitespace-nowrap text-xs font-semibold text-emerald-700">{when}</p>;
  }
  return (
    <span className="shrink-0 self-start whitespace-nowrap">
      <Badge tone="green">Next {when}</Badge>
    </span>
  );
}

/** Small tappable card for the Admin dashboard grid (two per row). */
export async function GroupMiniCard({ group }: { group: CommunityGroup }) {
  const [leaders, shown] = await Promise.all([getGroupLeaders(group), getNameDisplay()]);
  return (
    <Link
      href={`/groups/${group.id}`}
      prefetch={false}
      className="cv-item flex h-full flex-col gap-1.5 rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-slate-200/70 active:bg-slate-50"
    >
      <div className="flex items-center gap-2">
        <GroupAvatar group={group} size="xs" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="break-words text-sm font-semibold leading-snug">{group.name}</p>
          <p className={`break-words text-xs leading-snug ${leaders.length ? "text-slate-600" : "text-slate-400"}`}>
            {namesOrNotAssigned(leaders, shown)}
          </p>
          <NextFellowshipBadge group={group} compact />
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
export async function GroupDetailCard({ group }: { group: CommunityGroup }) {
  const [leaders, assistants, shown] = await Promise.all([
    getGroupLeaders(group),
    getGroupAssistantLeaders(group),
    getNameDisplay(),
  ]);

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
        {isGroupClosed(group) && (
          <span className="absolute right-2 top-2 whitespace-nowrap">
            <ClosedBadge />
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="break-words text-sm font-semibold leading-snug">{group.name}</p>
        {group.category && <p className="break-words text-xs text-slate-500">{group.category}</p>}
        <dl className="mt-2 space-y-1.5 border-t border-slate-100 pt-2">
          <MiniInfo label={leaders.length > 1 ? "Leaders" : "Leader"}>
            <span className={leaders.length ? "" : "text-slate-400"}>{namesOrNotAssigned(leaders, shown)}</span>
          </MiniInfo>
          {assistants.length > 0 && (
            <MiniInfo label="Asst. Leaders">{namesOrNotAssigned(assistants, shown)}</MiniInfo>
          )}
        </dl>
      </div>
    </Link>
  );
}

/** Group summary used on the Admin dashboard; place inside a divided Card. */
export async function GroupSummaryRow({ group }: { group: CommunityGroup }) {
  const [leaders, shown] = await Promise.all([getGroupLeaders(group), getNameDisplay()]);

  return (
    <Link
      href={`/groups/${group.id}`}
      prefetch={false}
      className="flex items-center gap-3 px-3 py-2.5 active:bg-slate-50"
    >
      <GroupAvatar group={group} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="break-words text-[15px] font-semibold">{group.name}</p>
        <p className={`break-words text-xs ${leaders.length ? "text-slate-500" : "text-slate-400"}`}>
          {namesOrNotAssigned(leaders, shown)}
        </p>
        <NextFellowshipBadge group={group} />
      </div>
      <ChevronRightIcon width={18} height={18} className="shrink-0 text-slate-400" />
    </Link>
  );
}

/** Compact tappable row used on the Admin Groups list. */
export async function GroupListItem({ group }: { group: CommunityGroup }) {
  const [leaders, assistants, shown] = await Promise.all([
    getGroupLeaders(group),
    getGroupAssistantLeaders(group),
    getNameDisplay(),
  ]);
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
            <span className={leaders.length ? "text-slate-700" : "text-slate-400"}>
              {" · "}
              {namesOrNotAssigned(leaders, shown)}
            </span>
          </p>
          {isGroupClosed(group) && (
            <span className="shrink-0">
              <ClosedBadge />
            </span>
          )}
        </div>
        <p className={`break-words text-sm ${assistants.length ? "text-slate-500" : "text-slate-400"}`}>
          {namesOrNotAssigned(assistants, shown)}
        </p>
      </div>
      <ChevronRightIcon className="mt-0.5 shrink-0 text-slate-400" />
    </Link>
  );
}

/** Group information and leadership, shared by My Group and the Admin group view. */
export async function GroupProfile({ group, hideAssistants = false }: { group: CommunityGroup; hideAssistants?: boolean }) {
  const [leaders, assistants, shown] = await Promise.all([
    getGroupLeaders(group),
    hideAssistants ? Promise.resolve([]) : getGroupAssistantLeaders(group),
    getNameDisplay(),
  ]);

  return (
    <Card className="overflow-hidden">
      {group.photo && <GroupHeroPhoto src={group.photo} name={group.name} />}
      <div className="flex items-center gap-4">
        {!group.photo && <GroupAvatar group={group} size="lg" />}
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-bold">{group.name}</h2>
          {group.category && <p className="text-slate-500">{group.category}</p>}
        </div>
        {isGroupClosed(group) && <ClosedBadge />}
      </div>
      <dl className="mt-3 divide-y divide-slate-100 border-t border-slate-100">
        {isGroupClosed(group) && group.closedAt && (
          <InfoRow label="Closed">{formatDate(group.closedAt)}</InfoRow>
        )}
        {group.frequency && <InfoRow label="Fellowship">{FREQUENCY_LABELS[group.frequency]}</InfoRow>}
        <InfoRow label={leaders.length > 1 ? "Leaders" : "Leader"}>
          <PeopleList people={leaders} shown={shown} />
        </InfoRow>
        {!hideAssistants && (
          <InfoRow label="Assistant Leaders">
            <PeopleList people={assistants} shown={shown} />
          </InfoRow>
        )}
      </dl>
    </Card>
  );
}
