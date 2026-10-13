import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client using the secret key. It bypasses all access rules (RLS),
 * so only use it after checking that the caller is allowed to do the action,
 * e.g. with `requireAdmin()`.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
