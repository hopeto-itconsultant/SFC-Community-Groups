// Imports the community groups and leader rosters from the prototype
// (data/groups.ts, data/users.ts) into an empty database, uploading the group
// photos from public/groups/. Leaders are created without logins; the Admin
// sets those up in the app (Groups > a group > Leaders & logins).
// Refuses to run if the database already has groups.
//
// Usage: npm run import-groups   (reads .env.local; run create-admin first)
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { groups } from "../data/groups.ts";
import { users } from "../data/users.ts";

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

const { count: groupCount, error: countError } = await supabase
  .from("groups")
  .select("id", { count: "exact", head: true });
if (countError) fail(`Checking for existing groups: ${countError.message}`);
if (groupCount) fail("The database already has groups. Nothing was imported.");

const { data: admin, error: adminError } = await supabase
  .from("profiles")
  .select("id")
  .eq("is_admin", true)
  .limit(1)
  .maybeSingle();
if (adminError) fail(`Finding the Admin: ${adminError.message}`);
if (!admin) fail("Create the Admin first: npm run create-admin");

console.log(`Importing ${groups.length} groups into ${url}`);

const leaders = users.filter((u) => u.role !== "admin");
const profileIds = new Map();
for (const u of leaders) {
  const { data, error } = await supabase.from("profiles").insert({ name: u.name }).select("id").single();
  if (error) fail(`Adding ${u.name}: ${error.message}`);
  profileIds.set(u.id, data.id);
}

// Leaders are listed in the order they were added, so stagger created_at.
let tick = Date.now();
const nextTimestamp = () => new Date(tick++).toISOString();

for (const g of groups) {
  const id = crypto.randomUUID();

  let photoPath = null;
  if (g.photo) {
    const file = await readFile(new URL(`../public${g.photo}`, import.meta.url));
    photoPath = `${id}/${crypto.randomUUID()}-1.jpg`;
    const { error } = await supabase.storage
      .from("group-photos")
      .upload(photoPath, file, { contentType: "image/jpeg" });
    if (error) fail(`Uploading the photo for ${g.name}: ${error.message}`);
  }

  const { error: groupError } = await supabase.from("groups").insert({
    id,
    name: g.name,
    category: g.category ?? null,
    frequency: g.frequency ?? null,
    photo_path: photoPath,
    created_by: admin.id,
    updated_by: admin.id,
  });
  if (groupError) fail(`Adding ${g.name}: ${groupError.message}`);

  const memberships = [
    ...g.leaderIds.map((uid) => ({ uid, role: "leader" })),
    ...g.assistantLeaderIds.map((uid) => ({ uid, role: "asst-leader" })),
  ].map(({ uid, role }) => ({
    group_id: id,
    profile_id: profileIds.get(uid),
    role,
    created_at: nextTimestamp(),
  }));
  if (memberships.length) {
    const { error } = await supabase.from("group_leaders").insert(memberships);
    if (error) fail(`Assigning leaders of ${g.name}: ${error.message}`);
  }

  console.log(`  ${g.name}: ${memberships.length} leaders${photoPath ? ", photo" : ""}`);
}

console.log(`Done. ${leaders.length} leaders added without logins; set those up in the app.`);
