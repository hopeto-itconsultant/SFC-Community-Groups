"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { CommunityGroup, User } from "@/data/types";
import { getCurrentUser } from "@/lib/auth";
import { getGroupById, getReportById } from "@/lib/data-access";
import { REPORT_BACKDATE_DAYS, daysAgoISO, todayISO } from "@/lib/format";
import { MAX_PHOTOS } from "@/lib/photos";
import { canEditPlan, isGroupClosed } from "@/lib/report-rules";
import { createClient } from "@/lib/supabase/server";
import { photoFiles, removePhotos, uploadPhotos } from "@/lib/uploads";
import type { FormState } from "./types";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date.");
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

const fellowshipSchema = z
  .object({
    date: isoDate,
    location: z.string().trim().min(1, "Enter the location.").max(200),
    attendees: count,
    firstTimers: count,
    summary: z.string().trim().max(4000),
    comments: optionalText,
    expenseAmount: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(0).optional()),
    expenseDetails: optionalText,
  })
  .refine((v) => v.firstTimers <= v.attendees, "First-time attendees can't be more than the number of attendees.")
  .refine(
    (v) => v.date >= daysAgoISO(REPORT_BACKDATE_DAYS) && v.date <= todayISO(),
    `The fellowship date must be within the last ${REPORT_BACKDATE_DAYS} days.`,
  );

export async function createFellowshipReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await reportingContext();
  if ("error" in ctx) return ctx;

  const parsed = fellowshipSchema.safeParse(
    fields(formData, [
      "date",
      "location",
      "attendees",
      "firstTimers",
      "summary",
      "comments",
      "expenseAmount",
      "expenseDetails",
    ]),
  );
  if (!parsed.success) return { error: firstError(parsed.error) };
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
    report_date: v.date,
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

const followUpSchema = z.object({
  personName: z.string().trim().min(1, "Enter the name of the person followed up.").max(200),
  mode: z.enum(["call", "text", "in-person"], "Please choose how you contacted them."),
  comments: optionalText,
});

export async function createFollowUpReport(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await reportingContext();
  if ("error" in ctx) return ctx;

  const parsed = followUpSchema.safeParse(fields(formData, ["personName", "mode", "comments"]));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const v = parsed.data;
  const supabase = await createClient();
  const id = crypto.randomUUID();
  const { error } = await supabase.from("reports").insert({
    id,
    group_id: ctx.group.id,
    type: "follow-up",
    filed_by: ctx.user.id,
    report_date: todayISO(),
    person_name: v.personName,
    contact_mode: v.mode,
    comments: v.comments,
  });
  if (error) return { error: `Could not save the follow-up: ${error.message}` };

  revalidatePath("/", "layout");
  redirect(`/reports/${id}?saved=new`);
}

const planSchema = z.object({
  proposedDate: isoDate.refine((d) => d >= todayISO(), "The proposed date can't be in the past."),
  location: z.string().trim().min(1, "Enter the location.").max(200),
  activity: z.string().trim().max(4000),
  goals: z.string().trim().min(1, "Enter the goals.").max(4000),
});

function parsePlan(formData: FormData) {
  return planSchema.safeParse(fields(formData, ["proposedDate", "location", "activity", "goals"]));
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
    report_date: v.proposedDate,
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
      report_date: v.proposedDate,
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
