// Creates the first Admin: a login (mobile number + password) and a linked
// profile. Run once per database; it refuses to run if an Admin already exists.
// Later accounts are created by the Admin inside the app.
//
// Usage: npm run create-admin   (reads .env.local)
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { Writable } from "node:stream";

const MOBILE_PATTERN = /^\+[1-9][0-9]{6,14}$/;
const MIN_PASSWORD_LENGTH = 8;

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
const rl = readline.createInterface({ input: process.stdin, output, terminal: true });

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
const mobile = (await rl.question("Mobile number with country code (e.g. +919876543210): ")).replace(/[\s-]/g, "");
const password = await askPassword(`Password (at least ${MIN_PASSWORD_LENGTH} characters): `);
const confirmation = await askPassword("Confirm password: ");
rl.close();

if (!name) fail("Name is required.");
if (!MOBILE_PATTERN.test(mobile)) fail("Mobile number must start with + and the country code, e.g. +919876543210.");
if (password.length < MIN_PASSWORD_LENGTH) fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
if (password !== confirmation) fail("Passwords do not match.");

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  phone: mobile,
  password,
  phone_confirm: true,
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
