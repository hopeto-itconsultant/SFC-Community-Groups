"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { recordError, recordSuccess } from "@/lib/activity-log";
import { getCurrentUser } from "@/lib/auth";
import { getGroupById } from "@/lib/data-access";
import { canEditGroup, isGroupClosed } from "@/lib/report-rules";
import { isAdminRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { photoFiles, removePhotos, uploadPhotos } from "@/lib/uploads";
import type { FormState } from "./types";

const groupSchema = z.object({
  name: z.string().trim().min(1, "Enter the group name.").max(100),
  category: z
    .string()
    .trim()
    .max(100)
    .transform((s) => s || null),
  frequency: z.enum(["monthly", "every-2-months"]).nullable(),
});

function parseGroup(formData: FormData) {
  return groupSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category") ?? "",
    frequency: formData.get("frequency") || null,
  });
}

function groupFail(action: string, summary: string, error: string | undefined): FormState {
  const message = error || "Something went wrong.";
  recordError({ feature: "groups", action, summary, errorMessage: message });
  return { error: message };
}

/** Uploads the form's group photo, if any, under a new name so cached copies never go stale. */
async function uploadGroupPhoto(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string, formData: FormData) {
  const files = photoFiles(formData, "photo", 1);
  if (typeof files === "string") return { error: files };
  if (!files.length) return { path: null };
  const paths = await uploadPhotos(supabase, "group-photos", groupId, crypto.randomUUID(), files);
  return "error" in paths ? paths : { path: paths[0] };
}

export async function createGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  const action = "group_create";
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return groupFail(action, "Group create failed", "Only the Admin can add groups.");
  }

  const parsed = parseGroup(formData);
  if (!parsed.success) return groupFail(action, "Group create failed", parsed.error.issues[0].message);

  const supabase = await createClient();
  const id = crypto.randomUUID();
  const photo = await uploadGroupPhoto(supabase, id, formData);
  if ("error" in photo) return groupFail(action, "Group create failed", photo.error ?? "Could not upload the photo.");

  const { error } = await supabase.from("groups").insert({
    id,
    ...parsed.data,
    photo_path: photo.path,
    created_by: user.id,
    updated_by: user.id,
  });
  if (error) {
    if (photo.path) await removePhotos(supabase, "group-photos", [photo.path]);
    return groupFail(action, "Group create failed", `Could not add the group: ${error.message}`);
  }

  recordSuccess({
    feature: "groups",
    action,
    summary: `Added group ${parsed.data.name}`,
    entityType: "group",
    entityId: id,
  });
  revalidatePath("/", "layout");
  redirect(`/groups/${id}?saved=added`);
}

export async function updateGroup(groupId: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const action = "group_update";
  const user = await getCurrentUser();
  const group = await getGroupById(groupId);
  if (!user || !group || !canEditGroup(user, group) || isGroupClosed(group)) {
    return groupFail(action, "Group update failed", "Only Admin and this group's leaders can edit it.");
  }

  const parsed = parseGroup(formData);
  if (!parsed.success) return groupFail(action, "Group update failed", parsed.error.issues[0].message);
  const { frequency, ...details } = parsed.data;

  const supabase = await createClient();
  const { data: current } = await supabase.from("groups").select("photo_path").eq("id", groupId).single();
  const photo = await uploadGroupPhoto(supabase, groupId, formData);
  if ("error" in photo) return groupFail(action, "Group update failed", photo.error ?? "Could not upload the photo.");

  const { error } = await supabase
    .from("groups")
    .update({
      ...details,
      // Only the Admin decides how often a group meets.
      ...(isAdminRole(user.role) ? { frequency } : {}),
      ...(photo.path ? { photo_path: photo.path } : {}),
      updated_by: user.id,
    })
    .eq("id", groupId);
  if (error) {
    if (photo.path) await removePhotos(supabase, "group-photos", [photo.path]);
    return groupFail(action, "Group update failed", `Could not save the group: ${error.message}`);
  }
  if (photo.path && current?.photo_path) await removePhotos(supabase, "group-photos", [current.photo_path]);

  recordSuccess({
    feature: "groups",
    action,
    summary: `Updated group ${parsed.data.name}`,
    entityType: "group",
    entityId: groupId,
  });
  revalidatePath("/", "layout");
  redirect(isAdminRole(user.role) ? `/groups/${groupId}?saved=updated` : "/group?saved=updated");
}

export async function closeGroup(groupId: string): Promise<FormState> {
  const action = "group_close";
  const user = await getCurrentUser();
  if (!user || !isAdminRole(user.role)) {
    return groupFail(action, "Group close failed", "Only the Admin can close groups.");
  }

  const group = await getGroupById(groupId);
  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ status: "closed", closed_at: new Date().toISOString(), updated_by: user.id })
    .eq("id", groupId)
    .eq("status", "active");
  if (error) return groupFail(action, "Group close failed", `Could not close the group: ${error.message}`);

  recordSuccess({
    feature: "groups",
    action,
    summary: `Closed group ${group?.name ?? groupId}`,
    entityType: "group",
    entityId: groupId,
  });
  revalidatePath("/", "layout");
  redirect(`/groups/${groupId}?saved=closed`);
}
