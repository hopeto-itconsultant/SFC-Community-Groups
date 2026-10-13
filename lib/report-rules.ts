// Pure rules and query shapes shared by the mock layer (data-access) and the
// Supabase layer (queries). Nothing here looks data up.
import type { CommunityGroup, ContactMode, NextFellowship, Report, ReportType, User } from "@/data/types";
import { todayISO } from "./format";

export function isGroupClosed(group: CommunityGroup): boolean {
  return group.status === "closed";
}

/** Admins, plus the leaders and assistant leaders of this group. */
export function canEditGroup(user: User, group: CommunityGroup): boolean {
  return user.role === "admin" || user.groupId === group.id;
}

/** Same people as `canEditGroup`, and only while the plan is upcoming and not cancelled. */
export function canEditPlan(user: User, plan: NextFellowship): boolean {
  return (user.role === "admin" || user.groupId === plan.groupId) && isUpcomingPlan(plan);
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
