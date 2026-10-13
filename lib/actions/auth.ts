"use server";

import { redirect } from "next/navigation";
import { loginEmailForMobile, normalizeMobile } from "@/lib/login-id";
import { createClient } from "@/lib/supabase/server";

export interface SignInState {
  error?: string;
  /** What was typed, so the form keeps it after an error. */
  mobile?: string;
}

export async function signIn(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const typed = String(formData.get("mobile") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const mobile = normalizeMobile(typed);
  if (!mobile) return { error: "Enter your mobile number, e.g. 9876543210.", mobile: typed };
  if (!password) return { error: "Enter your password.", mobile: typed };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmailForMobile(mobile),
    password,
  });
  if (error || !data.user) return { error: "Mobile number or password is incorrect.", mobile: typed };

  // Only active profiles are visible to their owner, so a missing row means no access.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();
  if (!profile) {
    await supabase.auth.signOut();
    return { error: "This account is not active. Please contact the Admin.", mobile: typed };
  }

  redirect("/home");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
