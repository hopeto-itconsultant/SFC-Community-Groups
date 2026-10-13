// Creates the first Admin: a login (mobile number + password) and a linked
// profile. Run once per database; it refuses to run if an Admin already exists.
// Later accounts are created by the Admin inside the app.
//
// Usage: npm run create-admin   (reads .env.local)
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { Writable } from "node:stream";
import { loginEmailForMobile, normalizeMobile } from "../lib/login-id.ts";
import { MIN_PASSWORD_LENGTH, passwordProblem } from "../lib/passwords.ts";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url || !secretKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local (see .env.example).");
  process.exit(1);
}

const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

let rl;

function fail(message) {
  // Exiting with the prompt still open crashes Node on Windows.
  rl?.close();
  console.error(message);
  process.exit(1);
}

const { count: adminCount, error: adminError } = await supabase
  .from("profiles")
  .select("id", { count: "exact", head: true })
  .eq("is_admin", true);
if (adminError) fail(`Checking for an existing Admin: ${adminError.message}`);
if (adminCount) fail("An Admin already exists. Add further accounts from the app.");

let muted = false;
const output = new Writable({
  write(chunk, encoding, callback) {
    if (!muted) process.stdout.write(chunk, encoding);
    callback();
  },
});
rl = readline.createInterface({ input: process.stdin, output, terminal: true });

async function askPassword(prompt) {
  process.stdout.write(prompt);
  muted = true;
  const answer = await rl.question("");
  muted = false;
  process.stdout.write("\n");
  return answer;
}

console.log(`Creating the first Admin for ${url}`);
const name = (await rl.question("Full name: ")).trim();
if (!name) fail("Name is required.");
const mobile = normalizeMobile(await rl.question("Mobile number (e.g. 9876543210 or 919876543210): "));
if (!mobile) fail("Enter a mobile number: 10 digits, or the country code followed by the number.");
const password = await askPassword(`Password (at least ${MIN_PASSWORD_LENGTH} characters): `);
const confirmation = await askPassword("Confirm password: ");
rl.close();

const problem = passwordProblem(password);
if (problem) fail(problem);
if (password !== confirmation) fail("Passwords do not match.");

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email: loginEmailForMobile(mobile),
  password,
  email_confirm: true,
});
if (createError) fail(`Creating the login: ${createError.message}`);

const { error: profileError } = await supabase
  .from("profiles")
  .insert({ auth_user_id: created.user.id, name, mobile, is_admin: true });
if (profileError) {
  await supabase.auth.admin.deleteUser(created.user.id);
  fail(`Creating the profile (login removed again): ${profileError.message}`);
}

console.log(`Admin created: ${name} (${mobile}). Sign in with this mobile number and password.`);
