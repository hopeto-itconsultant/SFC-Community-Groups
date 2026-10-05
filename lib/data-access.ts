// Single read layer over the mock data. Swap these implementations for
// Supabase queries later; screens should never import from /data directly.
import { groups } from "@/data/groups";
import { reports } from "@/data/reports";
import { users } from "@/data/users";
import type {
  CommunityGroup,
  ContactMode,
  FellowshipReport,
  FollowUpReport,
  NextFellowship,
  Report,
  ReportType,
  User,
} from "@/data/types";
import { todayISO } from "./format";

export function isGroupClosed(group: CommunityGroup): boolean {
  return group.status === "closed";
}

/** Active groups by name; closed groups are only included when asked for. */
export function getGroups({ includeClosed = false }: { includeClosed?: boolean } = {}): CommunityGroup[] {
  return groups
    .filter((g) => includeClosed || !isGroupClosed(g))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getClosedGroupCount(): number {
  return groups.filter(isGroupClosed).length;
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

/** Admins, plus the leaders and assistant leaders of this group. */
export function canEditGroup(user: User, group: CommunityGroup): boolean {
  return user.role === "admin" || user.groupId === group.id;
}

/** Same people as `canEditGroup`, and only while the plan is upcoming and not cancelled. */
export function canEditPlan(user: User, plan: NextFellowship): boolean {
  const group = getGroupById(plan.groupId);
  return !!group && canEditGroup(user, group) && isUpcomingPlan(plan);
}

export function isUpcomingPlan(plan: NextFellowship): boolean {
  return !plan.cancelledAt && plan.proposedDate >= todayISO();
}

/** The calendar date a report is about (fellowship date, follow-up date or proposed date). */
export function getReportDate(report: Report): string {
  return report.type === "next-fellowship" ? report.proposedDate : report.date;
}

/** "this-month": filed this calendar month. "upcoming": uncancelled next-fellowship plans dated today or later. */
export type ReportPeriod = "this-month" | "upcoming";

export interface ReportQuery {
  groupId?: string;
  type?: ReportType;
  period?: ReportPeriod;
  /** Only fellowship reports that recorded an expense. */
  withExpense?: boolean;
}

function hasExpense(report: Report): report is FellowshipReport {
  return report.type === "fellowship" && !!report.expenseAmount;
}

function inPeriod(report: Report, period: ReportPeriod | undefined): boolean {
  switch (period) {
    case "this-month":
      return report.createdAt.startsWith(todayISO().slice(0, 7));
    case "upcoming":
      return report.type === "next-fellowship" && isUpcomingPlan(report);
    default:
      return true;
  }
}

/** Reports sorted newest first by the date they are about. */
export function getReports({ groupId, type, period, withExpense }: ReportQuery = {}): Report[] {
  return reports
    .filter(
      (r) =>
        (!groupId || r.groupId === groupId) &&
        (!type || r.type === type) &&
        (!withExpense || hasExpense(r)) &&
        inPeriod(r, period),
    )
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
  return getReports({ groupId, period: "upcoming" })
    .filter((r): r is NextFellowship => r.type === "next-fellowship")
    .sort((a, b) => a.proposedDate.localeCompare(b.proposedDate));
}

export function getNextFellowship(groupId: string): NextFellowship | undefined {
  return getUpcomingFellowships(groupId)[0];
}

/** Reports filed during the current calendar month. */
export function getReportsFiledThisMonth(groupId?: string): Report[] {
  return getReports({ groupId, period: "this-month" });
}

export interface ReportTypeSummaries {
  fellowship: {
    total: number;
    thisMonth: number;
    lastDate?: string;
    avgAttendance: number;
    totalFirstTimers: number;
  };
  followUp: {
    total: number;
    thisMonth: number;
    lastDate?: string;
    byMode: Record<ContactMode, number>;
  };
  nextFellowship: {
    upcomingCount: number;
    next?: NextFellowship;
  };
  expenditure: {
    /** Fellowship reports that recorded an expense. */
    count: number;
    totalAmount: number;
    thisMonthAmount: number;
    avgAmount: number;
    lastDate?: string;
  };
}

function sumExpenses(list: Report[]): number {
  return list.reduce((sum, r) => sum + (r.type === "fellowship" ? (r.expenseAmount ?? 0) : 0), 0);
}

/** Per-type headline numbers for the Reports overview. */
export function getReportTypeSummaries(groupId?: string): ReportTypeSummaries {
  const today = todayISO();
  const filedThisMonth = getReportsFiledThisMonth(groupId);
  const countThisMonth = (type: ReportType) => filedThisMonth.filter((r) => r.type === type).length;

  const fellowships = getReports({ groupId, type: "fellowship" }).filter(
    (r): r is FellowshipReport => r.type === "fellowship",
  );
  const totalAttendance = fellowships.reduce((sum, r) => sum + r.attendees, 0);

  const followUps = getReports({ groupId, type: "follow-up" }).filter(
    (r): r is FollowUpReport => r.type === "follow-up",
  );
  const byMode: Record<ContactMode, number> = { call: 0, text: 0, "in-person": 0 };
  for (const r of followUps) byMode[r.mode]++;

  const upcoming = getUpcomingFellowships(groupId);

  const withExpenses = fellowships.filter(hasExpense);
  const totalExpenses = sumExpenses(withExpenses);

  return {
    fellowship: {
      total: fellowships.length,
      thisMonth: countThisMonth("fellowship"),
      lastDate: fellowships.find((r) => r.date <= today)?.date,
      avgAttendance: fellowships.length ? Math.round(totalAttendance / fellowships.length) : 0,
      totalFirstTimers: fellowships.reduce((sum, r) => sum + r.firstTimers, 0),
    },
    followUp: {
      total: followUps.length,
      thisMonth: countThisMonth("follow-up"),
      lastDate: followUps.find((r) => r.date <= today)?.date,
      byMode,
    },
    nextFellowship: {
      upcomingCount: upcoming.length,
      next: upcoming[0],
    },
    expenditure: {
      count: withExpenses.length,
      totalAmount: totalExpenses,
      thisMonthAmount: sumExpenses(filedThisMonth),
      avgAmount: withExpenses.length ? Math.round(totalExpenses / withExpenses.length) : 0,
      lastDate: withExpenses.find((r) => r.date <= today)?.date,
    },
  };
}
