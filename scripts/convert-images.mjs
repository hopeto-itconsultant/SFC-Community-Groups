// Converts HEIC/HEIF photos in public/groups/ to resized WebP.
// Most browsers (Chrome, Android, Windows) cannot display HEIC.
// Each photo is written as a full image (max 800px) and a 192px avatar,
// which is what phones actually display. Originals move to assets-source/groups/.
//
// Usage: npm run images
import convert from "heic-convert";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC_DIR = path.resolve("public/groups");
const THUMB_DIR = path.join(SRC_DIR, "thumbs");
const ORIGINALS_DIR = path.resolve("assets-source/groups");
const FULL_EDGE = 800;
const THUMB_EDGE = 192;

/** Real HEIC/HEIF files start with an ISO-BMFF "ftyp" box; some tools save JPEGs with a .heic name. */
function isRealHeic(buffer) {
  return buffer.subarray(4, 8).toString("ascii") === "ftyp";
}

async function writeVariants(source, name) {
  const image = sharp(source).rotate();
  const fullInfo = await image
    .clone()
    .resize(FULL_EDGE, FULL_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 68, effort: 5 })
    .toFile(path.join(SRC_DIR, `${name}.webp`));
  const thumbInfo = await image
    .clone()
    .resize(THUMB_EDGE, THUMB_EDGE, { fit: "cover", position: "centre" })
    .webp({ quality: 70, effort: 4 })
    .toFile(path.join(THUMB_DIR, `${name}.webp`));
  return { fullInfo, thumbInfo };
}

const files = (await fs.readdir(SRC_DIR)).filter((f) => /\.(heic|heif)$/i.test(f));

if (!files.length) {
  console.log("No HEIC/HEIF files found in public/groups/.");
  process.exit(0);
}

await fs.mkdir(THUMB_DIR, { recursive: true });
await fs.mkdir(ORIGINALS_DIR, { recursive: true });

for (const file of files) {
  const input = path.join(SRC_DIR, file);
  const name = path.parse(file).name.toLowerCase();
  const raw = await fs.readFile(input);
  const source = isRealHeic(raw)
    ? Buffer.from(await convert({ buffer: raw, format: "JPEG", quality: 1 }))
    : raw;
  const { fullInfo, thumbInfo } = await writeVariants(source, name);
  await fs.rename(input, path.join(ORIGINALS_DIR, file));
  console.log(
    `${file} -> groups/${name}.webp (${fullInfo.width}x${fullInfo.height}, ${Math.round(fullInfo.size / 1024)} KB), thumb ${Math.round(thumbInfo.size / 1024)} KB`,
  );
}
