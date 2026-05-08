/**
 * Optimize raster images under bymed-web/public/images/.
 *
 * For each .jpg/.jpeg/.png in the directory:
 *   - Re-encode to .webp at quality 82 with effort 6 (slowest, smallest).
 *   - Resize down to max 2560 px wide (matches our Next deviceSizes ceiling),
 *     never enlarges smaller assets.
 *   - Honors EXIF rotation so portrait phone photos don't end up sideways.
 *   - Skips a file when the .webp peer already exists AND is newer than the
 *     source — re-runs are cheap.
 *
 * Why not let Next handle this? Next's Image optimizer feeds Sharp the raw
 * source on every cold-cache hit. A 1.75 MB JPEG hero takes ~140 ms to
 * encode the first time; a 250 KB WebP hero takes ~30 ms. The optimized
 * cache hides the cost on warm hits, but cold hits (new size, new deploy
 * with new dimensions, etc.) still pay it. Re-encoding the source once
 * eliminates the tax permanently.
 *
 * Run from the bymed-web directory:
 *   npm run optimize:images
 * or via Docker (no host Node required):
 *   docker run --rm -v "<abs path to bymed-web>:/work" -w /work \
 *     node:22-alpine sh -c \
 *     "npm i --no-save --no-audit --no-fund sharp@0.33 && \
 *      node scripts/optimize-public-images.mjs"
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_IMAGES_DIR = path.resolve(__dirname, "..", "public", "images");

const MAX_WIDTH = 2560;
const QUALITY = 82;
const EFFORT = 6;
const CONVERTIBLE = new Set([".jpg", ".jpeg", ".png"]);

/** Format a byte count as a human-readable string. */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function isUpToDate(srcPath, dstPath) {
  try {
    const [srcStat, dstStat] = await Promise.all([
      fs.stat(srcPath),
      fs.stat(dstPath),
    ]);
    return dstStat.mtimeMs >= srcStat.mtimeMs;
  } catch {
    return false;
  }
}

async function optimizeOne(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (!CONVERTIBLE.has(ext)) return null;

  const baseName = filename.slice(0, filename.length - ext.length);
  const srcPath = path.join(PUBLIC_IMAGES_DIR, filename);
  const dstPath = path.join(PUBLIC_IMAGES_DIR, `${baseName}.webp`);

  if (await isUpToDate(srcPath, dstPath)) {
    return { filename, status: "skipped" };
  }

  const srcStat = await fs.stat(srcPath);
  const meta = await sharp(srcPath).metadata();

  let pipeline = sharp(srcPath).rotate();
  if (meta.width && meta.width > MAX_WIDTH) {
    pipeline = pipeline.resize({
      width: MAX_WIDTH,
      withoutEnlargement: true,
    });
  }

  await pipeline.webp({ quality: QUALITY, effort: EFFORT }).toFile(dstPath);
  const dstStat = await fs.stat(dstPath);

  return {
    filename,
    status: "converted",
    srcBytes: srcStat.size,
    dstBytes: dstStat.size,
    srcWidth: meta.width ?? null,
  };
}

async function main() {
  const entries = await fs.readdir(PUBLIC_IMAGES_DIR, { withFileTypes: true });
  const targets = entries.filter((e) => e.isFile()).map((e) => e.name);

  let converted = 0;
  let skipped = 0;
  let totalSrc = 0;
  let totalDst = 0;

  for (const name of targets) {
    const result = await optimizeOne(name);
    if (!result) continue;
    if (result.status === "skipped") {
      console.log(`  skip   ${name} (.webp already up to date)`);
      skipped++;
      continue;
    }
    const ratio = (1 - result.dstBytes / result.srcBytes) * 100;
    console.log(
      `  ok     ${name.padEnd(34)} ${formatBytes(result.srcBytes).padStart(10)} -> ${formatBytes(result.dstBytes).padStart(10)}  (-${ratio.toFixed(1)}%)`,
    );
    converted++;
    totalSrc += result.srcBytes;
    totalDst += result.dstBytes;
  }

  console.log("");
  console.log(`Converted ${converted} file(s), skipped ${skipped}.`);
  if (converted > 0) {
    const ratio = (1 - totalDst / totalSrc) * 100;
    console.log(
      `Total: ${formatBytes(totalSrc)} -> ${formatBytes(totalDst)}  (-${ratio.toFixed(1)}%)`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
