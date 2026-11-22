import { NOT_ASSIGNED, formatShortDateTimeDay } from "@/lib/format";
import { isGroupClosed } from "@/lib/report-rules";
import type { DirectoryPerson, GroupDirectoryEntry, UpcomingBrief } from "@/lib/data-access";
import type { GroupCardModel } from "@/lib/page-models";

export function toGroupCardModel(
  entry: GroupDirectoryEntry,
  shown: (name: string) => string,
  next?: UpcomingBrief,
): GroupCardModel {
  const leaders = entry.leaders.map((person) => shown(person.name));
  const assistants = entry.assistants.map((person) => shown(person.name));
  return {
    id: entry.group.id,
    name: entry.group.name,
    category: entry.group.category,
    photo: entry.group.photo,
    status: entry.group.status,
    frequency: entry.group.frequency,
    closedAt: entry.group.closedAt,
    leadersLabel: leaders.length ? leaders.join(", ") : NOT_ASSIGNED,
    assistantsLabel: assistants.length ? assistants.join(", ") : NOT_ASSIGNED,
    hasLeaders: leaders.length > 0,
    hasAssistants: assistants.length > 0,
    leaderCount: leaders.length,
    leaders,
    assistants,
    nextWhen: next ? formatShortDateTimeDay(next.proposedDate, next.time) : undefined,
    nextLocation: next?.location.trim() || undefined,
    closed: isGroupClosed(entry.group),
  };
}

export function formatMemberNames(people: DirectoryPerson[], shown: (name: string) => string): string[] {
  return people.map((person) => shown(person.name));
}
