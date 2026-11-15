import type { CommunityGroup, Frequency, GroupStatus } from "@/data/types";
import type { ReportTypeSummaries } from "@/lib/report-rules";

export interface GroupCardModel {
  id: string;
  name: string;
  category?: string;
  photo?: string;
  status?: GroupStatus;
  frequency?: Frequency;
  closedAt?: string;
  leadersLabel: string;
  assistantsLabel: string;
  hasLeaders: boolean;
  hasAssistants: boolean;
  leaderCount: number;
  leaders: string[];
  assistants: string[];
  nextWhen?: string;
  closed: boolean;
}

export type HomeModel =
  | {
      kind: "admin";
      welcomeName: string;
      groupCount: number;
      reportsThisMonth: number;
      planned: number;
      groups: GroupCardModel[];
    }
  | {
      kind: "leader";
      welcomeName: string;
      groupName: string;
      roleLabel: string;
      reportsThisMonth: number;
      planned: number;
      spentLabel: string;
      next: { id: string; date: string; when: string; location: string } | null;
      last: { id: string; when: string; detail: string } | null;
    }
  | { kind: "none"; welcomeName: string };

export interface GroupsModel {
  countLabel: string;
  showClosed: boolean;
  closedCount: number;
  groups: GroupCardModel[];
}

export interface ReportsOverviewModel {
  subtitle?: string;
  isAdmin: boolean;
  groupId?: string;
  summaries: ReportTypeSummaries;
}

export interface MyGroupModel {
  group: Pick<CommunityGroup, "id" | "name" | "category" | "frequency" | "photo" | "status" | "closedAt">;
  leaders: string[];
  assistants: string[];
  hideAssistants: boolean;
  savedTitle?: string;
  next: { id: string; date: string; time?: string; location: string; activity: string } | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

export function isHomeModel(value: unknown): value is HomeModel {
  if (!isRecord(value) || typeof value.welcomeName !== "string") return false;
  if (value.kind === "admin") return Array.isArray(value.groups) && typeof value.groupCount === "number";
  if (value.kind === "leader") return typeof value.groupName === "string" && typeof value.reportsThisMonth === "number";
  return value.kind === "none";
}

export function isGroupsModel(value: unknown): value is GroupsModel {
  return isRecord(value) && Array.isArray(value.groups) && typeof value.showClosed === "boolean";
}

export function isReportsOverviewModel(value: unknown): value is ReportsOverviewModel {
  if (!isRecord(value) || !isRecord(value.summaries) || typeof value.isAdmin !== "boolean") return false;
  const summaries = value.summaries;
  return (
    isRecord(summaries.fellowship) &&
    isRecord(summaries.followUp) &&
    isRecord(summaries.nextFellowship) &&
    isRecord(summaries.expenditure)
  );
}

export function isMyGroupModel(value: unknown): value is MyGroupModel {
  return isRecord(value) && isRecord(value.group) && typeof value.group.name === "string" && Array.isArray(value.leaders);
}
