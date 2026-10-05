// Single read layer over the mock data. Swap these implementations for
// Supabase queries later; screens should never import from /data directly.
import { groups } from "@/data/groups";
import { reports } from "@/data/reports";
import { users } from "@/data/users";
import type {
  CommunityGroup,
  FellowshipReport,
  NextFellowship,
  Report,
  ReportType,
  User,
} from "@/data/types";
import { todayISO } from "./format";

export function getGroups(): CommunityGroup[] {
  return groups;
}

export function getGroupById(id: string | undefined): CommunityGroup | undefined {
  return id ? groups.find((g) => g.id === id) : undefined;
}

export function getUsers(): User[] {
  return users;
}

export function getUserById(id: string | undefined): User | undefined {
  return id ? users.find((u) => u.id === id) : undefined;
}

export function getGroupLeaders(group: CommunityGroup): User[] {
  return group.leaderIds.map((id) => getUserById(id)).filter((u): u is User => !!u);
}

export function getGroupAssistantLeaders(group: CommunityGroup): User[] {
  return group.assistantLeaderIds
    .map((id) => getUserById(id))
    .filter((u): u is User => !!u);
}

/** The calendar date a report is about (fellowship date, follow-up date or proposed date). */
export function getReportDate(report: Report): string {
  return report.type === "next-fellowship" ? report.proposedDate : report.date;
}

export interface ReportQuery {
  groupId?: string;
  type?: ReportType;
}

/** Reports sorted newest first by the date they are about. */
export function getReports({ groupId, type }: ReportQuery = {}): Report[] {
  return reports
    .filter((r) => (!groupId || r.groupId === groupId) && (!type || r.type === type))
    .sort((a, b) => getReportDate(b).localeCompare(getReportDate(a)));
}

export function getReportById(id: string | undefined): Report | undefined {
  return id ? reports.find((r) => r.id === id) : undefined;
}

export function getLastFellowship(groupId: string): FellowshipReport | undefined {
  const today = todayISO();
  return getReports({ groupId, type: "fellowship" }).find(
    (r): r is FellowshipReport => r.type === "fellowship" && r.date <= today,
  );
}

/** Upcoming planned fellowships (today or later), soonest first. */
export function getUpcomingFellowships(groupId?: string): NextFellowship[] {
  const today = todayISO();
  return getReports({ groupId, type: "next-fellowship" })
    .filter((r): r is NextFellowship => r.type === "next-fellowship" && r.proposedDate >= today)
    .sort((a, b) => a.proposedDate.localeCompare(b.proposedDate));
}

export function getNextFellowship(groupId: string): NextFellowship | undefined {
  return getUpcomingFellowships(groupId)[0];
}

/** Reports filed during the current calendar month. */
export function getReportsFiledThisMonth(groupId?: string): Report[] {
  const month = todayISO().slice(0, 7);
  return getReports({ groupId }).filter((r) => r.createdAt.startsWith(month));
}
