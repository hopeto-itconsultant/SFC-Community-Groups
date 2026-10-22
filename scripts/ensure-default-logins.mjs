// Gives every leader and assistant leader who has no login the starting password.
// A mobile number becomes the sign-in address. A name with no number gets a
// placeholder login until a number is saved. Existing logins are left alone.
//
// Usage: npm run ensure-default-logins   (reads .env.local)
import { createClient } from "@supabase/supabase-js";
import { loginEmailForMobile, loginEmailForPendingProfile } from "../lib/login-id.ts";
import { DEFAULT_PASSWORD } from "../lib/passwords.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (see .env.example).");
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

function fail(message) {
  console.error(message);
  process.exit(1);
}

console.log(`Checking leaders without a login in ${url}`);

const failed = [];
let created = 0;

while (true) {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, name, mobile")
    .eq("is_admin", false)
    .eq("is_superadmin", false)
    .is("auth_user_id", null)
    .limit(100);
  if (error) fail(`Loading people: ${error.message}`);
  if (!profiles?.length) break;

  for (const profile of profiles) {
    const email = profile.mobile ? loginEmailForMobile(profile.mobile) : loginEmailForPendingProfile(profile.id);
    const { data: user, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: DEFAULT_PASSWORD,
      email_confirm: true,
    });
    if (authError || !user.user) {
      failed.push(`${profile.name}: ${authError?.message ?? "no user was returned."}`);
      continue;
    }
    const { error: linkError } = await supabase
      .from("profiles")
      .update({ auth_user_id: user.user.id })
      .eq("id", profile.id)
      .is("auth_user_id", null);
    if (linkError) {
      await supabase.auth.admin.deleteUser(user.user.id);
      failed.push(`${profile.name}: ${linkError.message}`);
      continue;
    }
    created += 1;
    console.log(`  ${profile.name}: ${profile.mobile ?? "waiting for a mobile number"}`);
  }

  // A failed row stays without a login, so the same page would repeat forever.
  if (failed.length) break;
}

if (!created && !failed.length) console.log("Everyone who is not an Admin already has a login.");
else console.log(`Created ${created} login${created === 1 ? "" : "s"}.`);

if (failed.length) {
  console.error(failed.join("\n"));
  process.exit(1);
}
