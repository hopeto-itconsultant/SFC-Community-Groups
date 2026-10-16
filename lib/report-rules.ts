// Pure rules and query shapes shared by the mock layer (data-access) and the
// Supabase layer (queries). Nothing here looks data up.
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
import { isAdminRole } from "@/lib/roles";
import { todayISO } from "./format";

export function isGroupClosed(group: CommunityGroup): boolean {
  return group.status === "closed";
}

/** Admins, plus the leaders and assistant leaders of this group. */
export function canEditGroup(user: User, group: CommunityGroup): boolean {
  return isAdminRole(user.role) || user.groupId === group.id;
}

/** Same people as `canEditGroup`, and only while the plan is upcoming and not cancelled. */
export function canEditPlan(user: User, plan: NextFellowship): boolean {
  return (isAdminRole(user.role) || user.groupId === plan.groupId) && isUpcomingPlan(plan);
}

/**
 * The latest fellowship or follow-up for the group. A leader needs an active
 * group. An admin may still correct that latest report after the group is closed.
 * `isLatest` is looked up by the caller; this function does not read the database.
 */
export function canEditFiledReport(
  user: User,
  report: FellowshipReport | FollowUpReport,
  group: CommunityGroup,
  isLatest: boolean,
): boolean {
  if (!isLatest || group.id !== report.groupId) return false;
  if (isAdminRole(user.role)) return true;
  return user.groupId === report.groupId && !isGroupClosed(group);
}

export function isUpcomingPlan(plan: NextFellowship): boolean {
  return !plan.cancelledAt && plan.proposedDate >= todayISO();
}

/** The calendar date a report is about (fellowship date, follow-up date or proposed date). */
export function getReportDate(report: Report): string {
  return report.type === "next-fellowship" ? report.proposedDate : report.date;
}

/**
 * Uncancelled plans dated today or earlier that still have no fellowship report.
 * One plan per date — the newest — with the newest date first.
 */
export function fileableFellowshipPlans(plans: NextFellowship[], filedDates: Iterable<string>): NextFellowship[] {
  const filed = new Set(filedDates);
  const today = todayISO();
  const newestByDate = new Map<string, NextFellowship>();
  for (const plan of plans) {
    if (plan.cancelledAt || plan.proposedDate > today || filed.has(plan.proposedDate)) continue;
    const current = newestByDate.get(plan.proposedDate);
    if (!current || plan.createdAt > current.createdAt) newestByDate.set(plan.proposedDate, plan);
  }
  return [...newestByDate.values()].sort((a, b) => b.proposedDate.localeCompare(a.proposedDate));
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
    nextDate?: string;
    nextDateCount: number;
    thisWeekCount: number;
    thisMonthCount: number;
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
