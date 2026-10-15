// Uploads the prototype group photos (public/groups/, named in data/groups.ts)
// onto matching groups that do not have a photo yet. Skips a group that already
// has one, so a photo a leader set later is left alone. Groups with no
// prototype photo are logged and left on the initials avatar.
//
// Usage: npm run seed-group-photos   (reads .env.local)
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { groups } from "../data/groups.ts";

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

const withPhoto = groups.filter((g) => g.photo);
const withoutPhoto = groups.filter((g) => !g.photo);

console.log(`Seeding photos for ${withPhoto.length} groups into ${url}`);

let seeded = 0;
for (const g of withPhoto) {
  const { data: matches, error: findError } = await supabase
    .from("groups")
    .select("id, photo_path")
    .eq("name", g.name);
  if (findError) fail(`Finding ${g.name}: ${findError.message}`);
  if (matches.length !== 1) {
    fail(`Expected one group named "${g.name}", found ${matches.length}.`);
  }

  const group = matches[0];
  if (group.photo_path) {
    console.log(`  ${g.name}: already has a photo, skipped`);
    continue;
  }

  const file = await readFile(new URL(`../public${g.photo}`, import.meta.url));
  const photoPath = `${group.id}/${crypto.randomUUID()}-1.jpg`;
  const { error: uploadError } = await supabase.storage
    .from("group-photos")
    .upload(photoPath, file, { contentType: "image/jpeg" });
  if (uploadError) fail(`Uploading the photo for ${g.name}: ${uploadError.message}`);

  const { error: updateError } = await supabase.from("groups").update({ photo_path: photoPath }).eq("id", group.id);
  if (updateError) {
    await supabase.storage.from("group-photos").remove([photoPath]);
    fail(`Saving the photo for ${g.name}: ${updateError.message}`);
  }

  seeded += 1;
  console.log(`  ${g.name}: photo`);
}

for (const g of withoutPhoto) {
  console.log(`  ${g.name}: no prototype photo`);
}

console.log(`Done. ${seeded} photos added.`);
