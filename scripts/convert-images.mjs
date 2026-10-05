// Converts HEIC/HEIF photos in public/groups/ to web-friendly JPGs.
// Most browsers (Chrome, Android, Windows) cannot display HEIC.
// Originals are moved to assets-source/groups/ so they are not served.
//
// Usage: npm run images
import convert from "heic-convert";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC_DIR = path.resolve("public/groups");
const ORIGINALS_DIR = path.resolve("assets-source/groups");
const MAX_SIZE = 800;
const QUALITY = 80;

/** Real HEIC/HEIF files start with an ISO-BMFF "ftyp" box; some tools save JPEGs with a .heic name. */
function isRealHeic(buffer) {
  return buffer.subarray(4, 8).toString("ascii") === "ftyp";
}

const files = (await fs.readdir(SRC_DIR)).filter((f) => /\.(heic|heif)$/i.test(f));

if (!files.length) {
  console.log("No HEIC/HEIF files found in public/groups/.");
  process.exit(0);
}

await fs.mkdir(ORIGINALS_DIR, { recursive: true });

for (const file of files) {
  const input = path.join(SRC_DIR, file);
  const name = path.parse(file).name.toLowerCase();
  const output = path.join(SRC_DIR, `${name}.jpg`);

  const raw = await fs.readFile(input);
  const source = isRealHeic(raw)
    ? Buffer.from(await convert({ buffer: raw, format: "JPEG", quality: 1 }))
    : raw;
  const info = await sharp(source)
    .rotate()
    .resize(MAX_SIZE, MAX_SIZE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(output);

  await fs.rename(input, path.join(ORIGINALS_DIR, file));
  console.log(`${file} -> groups/${name}.jpg (${info.width}x${info.height}, ${Math.round(info.size / 1024)} KB)`);
}
