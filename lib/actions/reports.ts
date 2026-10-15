"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { CommunityGroup, FellowshipReport, User } from "@/data/types";
import { getCurrentUser } from "@/lib/auth";
import { getGroupById, getReportById, hasFellowshipOnDate, isLatestFiledReport } from "@/lib/data-access";
import { combineDateAndTime, startOfDayTimestamp, todayISO } from "@/lib/format";
import { MAX_PHOTOS, storagePath } from "@/lib/photos";
import { canEditFiledReport, canEditPlan, isGroupClosed } from "@/lib/report-rules";
import { createClient } from "@/lib/supabase/server";
import { photoFiles, removePhotos, uploadPhotos } from "@/lib/uploads";
import type { FormState } from "./types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/, "Choose a time.");
const optionalText = z
  .string()
  .trim()
  .max(4000)
  .transform((s) => s || null);
const count = z.coerce.number().int("Enter a whole number.").min(0, "Numbers can't be negative.");

/** Leaders and assistant leaders file reports for their own, active group. */
async function reportingContext(): Promise<{ user: User; group: CommunityGroup } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };
  const group = user.role === "admin" ? undefined : await getGroupById(user.groupId);
  if (!group) return { error: "Only group leaders can file reports." };
  if (isGroupClosed(group)) return { error: `${group.name} is closed, so no new reports can be filed.` };
  return { user, group };
}

function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form.";
}

function fields(formData: FormData, names: string[]): Record<string, FormDataEntryValue | null> {
  return Object.fromEntries(names.map((n) => [n, formData.get(n)]));
}

function saveError(error: { message: string; code?: string }, fallback: string): string {
  if (error.code === "42501" || /row-level security|cannot be changed/i.test(error.message)) {
    return "This report can no longer be changed.";
  }
  return `${fallback} ${error.message}`;
}

const FELLOWSHIP_FIELDS = [
  "date",
  "time",
  "location",
  "attendees",
  "firstTimers",
  "summary",
  "comments",
  "expenseAmount",
  "expenseDetails",
] as const;

const fellowshipSchema = z
  .object({
    date: isoDate,
    time: clockTime,
    location: z.string().trim().min(1, "Enter the location.").max(200),
    attendees: count,
    firstTimers: count,
    summary: z.string().trim().max(4000),
    comments: optionalText,
    expenseAmount: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).optional()),
    expenseDetails: optionalText,
  })
  .refine((v) => v.firstTimers <= v.attendees, "First-time attendees can't be more than the number of attendees.")
  .refine((v) => v.date <= todayISO(), "The fellowship date can't be in the future.");

export async function createFellowshipReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await reportingContext();
  if ("error" in ctx) return ctx;

  const parsed = fellowshipSchema.safeParse(fields(formData, [...FELLOWSHIP_FIELDS]));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (await hasFellowshipOnDate(ctx.group.id, parsed.data.date)) {
    return { error: "A fellowship report has already been filed for that date." };
  }
  const files = photoFiles(formData, "photos", MAX_PHOTOS);
  if (typeof files === "string") return { error: files };

  const v = parsed.data;
  const supabase = await createClient();
  const id = crypto.randomUUID();
  const photoPaths = await uploadPhotos(supabase, "report-photos", ctx.group.id, id, files);
  if ("error" in photoPaths) return photoPaths;

  const { error } = await supabase.from("reports").insert({
    id,
    group_id: ctx.group.id,
    type: "fellowship",
    filed_by: ctx.user.id,
    report_date: combineDateAndTime(v.date, v.time),
    location: v.location,
    attendees: v.attendees,
    first_timers: v.firstTimers,
    summary: v.summary,
    comments: v.comments,
    expense_amount: v.expenseAmount || null,
    expense_details: v.expenseAmount ? v.expenseDetails : null,
    photo_paths: photoPaths,
  });
  if (error) {
    await removePhotos(supabase, "report-photos", photoPaths);
    return { error: `Could not save the report: ${error.message}` };
  }

  revalidatePath("/", "layout");
  redirect(`/reports/${id}?saved=new`);
}

/** The fellowship or follow-up, if the signed-in user may still change it. */
async function editableFiledReport(reportId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };
  const report = await getReportById(reportId);
  if (!report || (report.type !== "fellowship" && report.type !== "follow-up")) {
    return { error: "This report could not be found." };
  }
  const group = await getGroupById(report.groupId);
  if (!group || !canEditFiledReport(user, report, group, await isLatestFiledReport(report))) {
    return { error: "This report can no longer be changed." };
  }
  return { user, group, report };
}

function fellowshipPhotoPaths(report: FellowshipReport): string[] | { error: string } {
  const paths: string[] = [];
  for (const url of report.photos) {
    const path = storagePath("report-photos", url);
    if (!path) return { error: "A photo on this report could not be read." };
    paths.push(path);
  }
  return paths;
}

/** Paths the form kept, in the report's current order. Rejects anything that is not already on it. */
function keptPhotoPaths(formData: FormData, current: string[]): string[] | string {
  const requested = formData.getAll("keptPhotos").filter((value): value is string => typeof value === "string");
  const currentSet = new Set(current);
  if (requested.some((path) => !currentSet.has(path))) return "A photo on this report could not be kept.";
  const wanted = new Set(requested);
  return current.filter((path) => wanted.has(path));
}

export async function updateFellowshipReport(
  reportId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await editableFiledReport(reportId);
  if ("error" in ctx) return ctx;
  if (ctx.report.type !== "fellowship") return { error: "This report could not be found." };

  const parsed = fellowshipSchema.safeParse(fields(formData, [...FELLOWSHIP_FIELDS]));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (await hasFellowshipOnDate(ctx.group.id, parsed.data.date, reportId)) {
    return { error: "A fellowship report has already been filed for that date." };
  }

  const currentPaths = fellowshipPhotoPaths(ctx.report);
  if ("error" in currentPaths) return currentPaths;
  const kept = keptPhotoPaths(formData, currentPaths);
  if (typeof kept === "string") return { error: kept };
  const files = photoFiles(formData, "photos", MAX_PHOTOS - kept.length);
  if (typeof files === "string") return { error: files };

  const supabase = await createClient();
  const uploaded = await uploadPhotos(supabase, "report-photos", ctx.group.id, crypto.randomUUID(), files);
  if ("error" in uploaded) return uploaded;

  const v = parsed.data;
  const { error } = await supabase
    .from("reports")
    .update({
      report_date: combineDateAndTime(v.date, v.time),
      location: v.location,
      attendees: v.attendees,
      first_timers: v.firstTimers,
      summary: v.summary,
      comments: v.comments,
      expense_amount: v.expenseAmount || null,
      expense_details: v.expenseAmount ? v.expenseDetails : null,
      photo_paths: [...kept, ...uploaded],
      updated_by: ctx.user.id,
    })
    .eq("id", reportId);
  if (error) {
    await removePhotos(supabase, "report-photos", uploaded);
    return { error: saveError(error, "Could not save the report:") };
  }

  await removePhotos(
    supabase,
    "report-photos",
    currentPaths.filter((path) => !kept.includes(path)),
  );
  revalidatePath("/", "layout");
  redirect(`/reports/${reportId}?saved=updated`);
}

const followUpSchema = z.object({
  date: isoDate.refine((d) => d <= todayISO(), "The follow-up date can't be in the future."),
  personName: z.string().trim().min(1, "Enter the name of the person followed up.").max(200),
  mode: z.enum(["call", "text", "in-person"], "Please choose how you contacted them."),
  comments: optionalText,
});

export async function createFollowUpReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await reportingContext();
  if ("error" in ctx) return ctx;

  const parsed = followUpSchema.safeParse(fields(formData, ["date", "personName", "mode", "comments"]));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const v = parsed.data;
  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("reports").insert({
    id,
    group_id: ctx.group.id,
    type: "follow-up",
    filed_by: ctx.user.id,
    report_date: startOfDayTimestamp(v.date),
    person_name: v.personName,
    contact_mode: v.mode,
    comments: v.comments,
  });
  if (error) return { error: `Could not save the follow-up: ${error.message}` };

  revalidatePath("/", "layout");
  redirect(`/reports/${id}?saved=new`);
}

export async function updateFollowUpReport(
  reportId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const ctx = await editableFiledReport(reportId);
  if ("error" in ctx) return ctx;
  if (ctx.report.type !== "follow-up") return { error: "This report could not be found." };

  const parsed = followUpSchema.safeParse(fields(formData, ["date", "personName", "mode", "comments"]));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      report_date: startOfDayTimestamp(v.date),
      person_name: v.personName,
      contact_mode: v.mode,
      comments: v.comments,
      updated_by: ctx.user.id,
    })
    .eq("id", reportId);
  if (error) return { error: saveError(error, "Could not save the follow-up:") };

  revalidatePath("/", "layout");
  redirect(`/reports/${reportId}?saved=updated`);
}

const planSchema = z.object({
  proposedDate: isoDate.refine((d) => d >= todayISO(), "The proposed date can't be in the past."),
  time: clockTime,
  location: z.string().trim().min(1, "Enter the location.").max(200),
  activity: z.string().trim().max(4000),
  goals: z.string().trim().min(1, "Enter the goals.").max(4000),
});

function parsePlan(formData: FormData) {
  return planSchema.safeParse(fields(formData, ["proposedDate", "time", "location", "activity", "goals"]));
}

export async function createPlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await reportingContext();
  if ("error" in ctx) return ctx;

  const parsed = parsePlan(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const v = parsed.data;
  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("reports").insert({
    id,
    group_id: ctx.group.id,
    type: "next-fellowship",
    filed_by: ctx.user.id,
    report_date: combineDateAndTime(v.proposedDate, v.time),
    location: v.location,
    activity: v.activity,
    goals: v.goals,
  });
  if (error) return { error: `Could not save the plan: ${error.message}` };

  revalidatePath("/", "layout");
  redirect(`/reports/${id}?saved=new`);
}

/** The plan, if the signed-in user may still change it. */
async function editablePlan(planId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has ended. Please sign in again." };
  const plan = await getReportById(planId);
  if (!plan || plan.type !== "next-fellowship" || !canEditPlan(user, plan)) {
    return { error: "Only Admin and this group's leaders can change an upcoming plan." };
  }
  return { user, plan };
}

export async function updatePlan(planId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await editablePlan(planId);
  if ("error" in ctx) return ctx;

  const parsed = parsePlan(formData);
  if (!parsed.success) return { error: firstError(parsed.error) };

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({
      report_date: combineDateAndTime(v.proposedDate, v.time),
      location: v.location,
      activity: v.activity,
      goals: v.goals,
      updated_by: ctx.user.id,
    })
    .eq("id", planId);
  if (error) return { error: `Could not save the plan: ${error.message}` };

  revalidatePath("/", "layout");
  redirect(`/reports/${planId}?saved=updated`);
}

export async function cancelPlan(planId: string): Promise<FormState> {
  const ctx = await editablePlan(planId);
  if ("error" in ctx) return ctx;

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .update({ cancelled_at: new Date().toISOString(), updated_by: ctx.user.id })
    .eq("id", planId);
  if (error) return { error: `Could not cancel the plan: ${error.message}` };

  revalidatePath("/", "layout");
  redirect(`/reports/${planId}?saved=cancelled`);
}
