import type { SupabaseClient, User } from "@supabase/supabase-js";

type AuthAdmin = SupabaseClient["auth"]["admin"];

/**
 * Hosted projects keep "Confirm email" on. Creating a user marks the account
 * confirmed only when we say so, and the email identity stays unverified until
 * a follow-up update. Sign-in then rejects the starting password until someone
 * resets it. Confirming the same address marks the account ready to use.
 */
export function loginNeedsActivation(user: User, email: string): boolean {
  if (!user.email_confirmed_at) return true;
  if ((user.email ?? "").toLowerCase() !== email.toLowerCase()) return true;
  const identity = user.identities?.find((item) => item.provider === "email");
  if (!identity) return true;
  const verified = identity.identity_data?.email_verified;
  return verified !== true;
}

/** Confirms every internal login that cannot sign in yet. Passwords stay as they are. */
export async function confirmOutstandingLogins(admin: AuthAdmin): Promise<void> {
  const perPage = 200;
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.listUsers({ page, perPage });
    if (error || !data?.users.length) return;
    for (const user of data.users) {
      const email = user.email ?? "";
      if (!email.endsWith("@login.sfc.invalid")) continue;
      if (!loginNeedsActivation(user, email)) continue;
      await confirmLogin(admin, user.id, email);
    }
    if (data.users.length < perPage) return;
  }
}

let outstandingSweep: Promise<void> | null = null;

/** Runs the confirmation sweep once per server process. */
export function sweepOutstandingLogins(admin: AuthAdmin): Promise<void> {
  outstandingSweep ??= confirmOutstandingLogins(admin).catch(() => {
    outstandingSweep = null;
  });
  return outstandingSweep;
}

/** Points this login at `email` and marks that address confirmed. Does not change the password. */
export async function confirmLogin(admin: AuthAdmin, userId: string, email: string): Promise<string | null> {
  const { error } = await admin.updateUserById(userId, { email, email_confirm: true });
  return error ? error.message : null;
}

/**
 * Creates a password login that can sign in immediately.
 * Returns the auth user id, or an error message.
 */
export async function createConfirmedLogin(
  admin: AuthAdmin,
  email: string,
  password: string,
): Promise<{ id: string } | { error: string }> {
  const { data, error } = await admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) return { error: error?.message ?? "no user was returned." };
  const confirmError = await confirmLogin(admin, data.user.id, email);
  if (confirmError) {
    await admin.deleteUser(data.user.id);
    return { error: confirmError };
  }
  return { id: data.user.id };
}
