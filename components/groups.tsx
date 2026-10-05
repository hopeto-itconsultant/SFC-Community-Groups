import Image from "next/image";
import Link from "next/link";
import type { CommunityGroup, User } from "@/data/types";
import {
  getGroupAssistantLeaders,
  getGroupLeaders,
  getLastFellowship,
  getNextFellowship,
} from "@/lib/data-access";
import { FREQUENCY_LABELS, NOT_ASSIGNED, formatDate } from "@/lib/format";
import { GroupAvatar } from "./GroupAvatar";
import { ChevronRightIcon } from "./icons";
import { Card, InfoRow, LinkButton } from "./ui";

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

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col justify-between p-3">
      <p className="text-xs font-medium leading-tight text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-700">{value}</p>
    </Card>
  );
}

/** Summary card used on the Admin dashboard. */
export function GroupCard({ group }: { group: CommunityGroup }) {
  const leaders = getGroupLeaders(group);
  const last = getLastFellowship(group.id);
  const next = getNextFellowship(group.id);

  return (
    <Card>
      <div className="flex items-center gap-3">
        <GroupAvatar group={group} />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{group.name}</h3>
          <p className="text-sm text-slate-500">{group.category}</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 border-t border-slate-100 pt-1">
        <InfoRow label={leaders.length > 1 ? "Leaders" : "Leader"}>
          <span className={leaders.length ? "" : "text-slate-400"}>{namesOrNotAssigned(leaders)}</span>
        </InfoRow>
        <InfoRow label="Frequency">{FREQUENCY_LABELS[group.frequency]}</InfoRow>
        <InfoRow label="Last Fellowship">
          {last ? formatDate(last.date) : <span className="text-slate-400">None yet</span>}
        </InfoRow>
        <InfoRow label="Next Fellowship">
          {next ? formatDate(next.proposedDate) : <span className="text-slate-400">Not planned</span>}
        </InfoRow>
      </dl>
      <LinkButton href={`/groups/${group.id}`} variant="secondary" block className="mt-3">
        View Group
      </LinkButton>
    </Card>
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
          {group.category} · {FREQUENCY_LABELS[group.frequency]}
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
          <p className="text-slate-500">{group.category}</p>
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
