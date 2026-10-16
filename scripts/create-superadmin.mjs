// Creates the one superadmin: a username login and a linked profile with
// is_admin and is_superadmin. Name and mobile number are optional. A mobile
// number can also be used to sign in.
// Run once per database; it refuses if a superadmin already exists.
// Normal admins may already exist.
//
// Usage: npm run create-superadmin   (reads .env.local)
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { Writable } from "node:stream";
import { USERNAME_RULE, loginEmailForUsername, normalizeMobile, normalizeUsername } from "../lib/login-id.ts";
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

const { count: superCount, error: superError } = await supabase
  .from("profiles")
  .select("id", { count: "exact", head: true })
  .eq("is_superadmin", true);
if (superError) fail(`Checking for an existing superadmin: ${superError.message}`);
if (superCount) fail("A superadmin already exists.");

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

console.log(`Creating the superadmin for ${url}`);
const username = normalizeUsername(await rl.question("Username: "));
if (!username) fail(USERNAME_RULE);
const nameInput = (await rl.question("Name (optional): ")).trim();
if (nameInput.length > 100) fail("Use a shorter name.");
const name = nameInput || username;
const mobileInput = (await rl.question("Mobile number (optional, e.g. 9876543210): ")).trim();
const mobile = mobileInput ? normalizeMobile(mobileInput) : null;
if (mobileInput && !mobile) fail("Enter a mobile number: 10 digits, or the country code followed by the number.");
const password = await askPassword(`Password (at least ${MIN_PASSWORD_LENGTH} characters): `);
const confirmation = await askPassword("Confirm password: ");
rl.close();

const problem = passwordProblem(password);
if (problem) fail(problem);
if (password !== confirmation) fail("Passwords do not match.");

const { data: takenUsername, error: usernameError } = await supabase
  .from("profiles")
  .select("name")
  .eq("username", username)
  .maybeSingle();
if (usernameError) fail(`Checking the username: ${usernameError.message}`);
if (takenUsername) fail(`${username} is already used.`);
if (mobile) {
  const { data: takenMobile, error: mobileError } = await supabase
    .from("profiles")
    .select("name")
    .eq("mobile", mobile)
    .maybeSingle();
  if (mobileError) fail(`Checking the mobile number: ${mobileError.message}`);
  if (takenMobile) fail(`${mobile} is already used.`);
}

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email: loginEmailForUsername(username),
  password,
  email_confirm: true,
});
if (createError) fail(`Creating the login: ${createError.message}`);

const { error: profileError } = await supabase.from("profiles").insert({
  auth_user_id: created.user.id,
  name,
  username,
  mobile,
  is_admin: true,
  is_superadmin: true,
});
if (profileError) {
  await supabase.auth.admin.deleteUser(created.user.id);
  fail(`Creating the profile (login removed again): ${profileError.message}`);
}

const signInWith = mobile ? "this username or mobile number" : "this username";
console.log(
  `Superadmin created: ${name} (${username}${mobile ? `, ${mobile}` : ""}). Sign in with ${signInWith} and password.`,
);
