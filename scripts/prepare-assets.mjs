/**
 * Asset pipeline for MEGA EVENT TEST DRIVE 8 — ДАРХАН ХОТ.
 *
 * The artwork supplied for this edition is two files in `../testdrive8`:
 *
 *  - "MEGA TEST DRIVE 8.png"   the campaign lockup — MEGA Event / TEST DRIVE 8
 *                              over the red ДАРХАН ХОТ plate — white-to-chrome
 *                              and red on transparency, 5315×2147. This is the
 *                              page's signature and is never rebuilt as type.
 *  - "MEGA DARKHAN CITY undsen poster 1x1 ratio 2.png"   3543², the feed poster.
 *
 * The page carries no photography — the campaign lockup is its whole visual
 * argument — so all this script produces is the lockup and one social card.
 *
 * ── The poster is information, not artwork ────────────────────────────────
 * It is a vertical sandwich: the SAIN MOTORS credit, the campaign lockup, the
 * fleet on wet asphalt over Darkhan at dusk, a marque list, then a bar carrying
 * the dates, the place and the hours. Every one of those layers except the
 * photograph is typography this page sets as real text, so the poster cannot be
 * a hero, a background or a crop. It is kept whole, once, as the social card —
 * a link preview is the one place baked-in type is the right answer.
 *
 * ── What is NOT rebuilt here ──────────────────────────────────────────────
 * `public/brand/sain-motors.png`. The distributor wordmark did not change
 * between editions and no new source for it was supplied, so the committed
 * asset is kept as it is. Edition 7's script derived it from artwork that is no
 * longer on disk; rebuilding from a file that does not exist is how a pipeline
 * silently drops a logo.
 *
 * Run:  node scripts/prepare-assets.mjs [--analyze]
 * Source override:  MTD8_SOURCE_DIR="D:/path/to/art" node scripts/prepare-assets.mjs
 *
 * Outputs are committed, so this only re-runs when the artwork changes.
 * `--analyze` prints every measurement it derives and writes nothing.
 */

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SOURCE_DIR =
  process.env.MTD8_SOURCE_DIR ?? path.resolve(import.meta.dirname, "..", "..", "testdrive8");

const PUBLIC_DIR = path.resolve(import.meta.dirname, "..", "public");
const ANALYZE = process.argv.includes("--analyze");

/** The poster is 12.5MP; libvips' default ceiling is lower. */
const OPEN = { limitInputPixels: false, unlimited: true };

const SOURCES = {
  lockup: "MEGA TEST DRIVE 8.png",
  posterSquare: "MEGA DARKHAN CITY undsen poster 1x1 ratio 2.png",
};

const log = (...parts) => console.log(...parts);

function src(key) {
  return path.join(SOURCE_DIR, SOURCES[key]);
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

/* ── measurement ─────────────────────────────────────────────────────────── */

/**
 * How much ink each row and column of an image carries, read off the alpha
 * channel. The crop below is derived from these two arrays rather than from
 * pixel offsets typed in by hand, so re-exporting the artwork at another scale
 * cannot silently move it.
 */
async function alphaProfile(file) {
  const { data, info } = await sharp(file, OPEN)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const rows = new Float64Array(height);
  const columns = new Float64Array(width);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width * channels;
    for (let x = 0; x < width; x += 1) {
      const alpha = data[rowStart + x * channels + channels - 1];
      if (alpha === 0) continue;
      rows[y] += alpha;
      columns[x] += alpha;
    }
  }

  return { width, height, rows, columns };
}

/** Runs of consecutive indices whose weight clears `threshold`. */
function occupiedRuns(weights, threshold) {
  const runs = [];
  let start = -1;

  for (let i = 0; i < weights.length; i += 1) {
    const filled = weights[i] > threshold;
    if (filled && start === -1) start = i;
    if (!filled && start !== -1) {
      runs.push({ start, end: i - 1 });
      start = -1;
    }
  }
  if (start !== -1) runs.push({ start, end: weights.length - 1 });

  return runs;
}

/** Tight bounding box of everything non-transparent. */
function alphaBox({ width, height, rows, columns }) {
  const rowRuns = occupiedRuns(rows, 0);
  const columnRuns = occupiedRuns(columns, 0);
  const top = rowRuns[0]?.start ?? 0;
  const bottom = rowRuns[rowRuns.length - 1]?.end ?? height - 1;
  const left = columnRuns[0]?.start ?? 0;
  const right = columnRuns[columnRuns.length - 1]?.end ?? width - 1;

  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

/* ── the lockup ──────────────────────────────────────────────────────────── */

/**
 * The campaign lockup, kept exactly as drawn — white, chrome and red on
 * transparency. It was composed for a dark ground, which is the only ground this
 * page has, so nothing is re-inked and no effect is added. It is trimmed to its
 * own ink and downscaled to what the page actually paints, and that is the whole
 * treatment.
 *
 * The supplied file is already tight to its ink (its alpha box is the full
 * canvas), so the trim is a no-op here. It is still measured rather than
 * assumed: a later re-export carrying a transparent margin would otherwise ship
 * a lockup that sits visibly off-centre from the type beneath it.
 */
async function buildLockup() {
  const file = src("lockup");
  const profile = await alphaProfile(file);
  const box = alphaBox(profile);
  const width = 1800;

  /*
   * The two ink bands are the wordmark and the ДАРХАН ХОТ plate under it. Both
   * are kept: unlike edition 7's SAIN artwork, neither band is a hairline that
   * collapses at display size, and the plate carries the city — which is the one
   * thing that makes this edition's identity its own.
   */
  const inkFloor = Math.max(...profile.rows) * 0.02;
  const bands = occupiedRuns(profile.rows, inkFloor).filter(
    (band) => band.end - band.start + 1 >= profile.height * 0.01,
  );

  log(
    `  ${SOURCES.lockup}  ${profile.width}×${profile.height}` +
      `  bands: ${bands.map((b) => `${b.start}–${b.end}`).join(", ")}` +
      `  →  trim ${box.width}×${box.height}  →  ${width}px wide`,
  );
  if (ANALYZE) return;

  await ensureDir(path.join(PUBLIC_DIR, "brand"));
  await sharp(file, OPEN)
    .extract(box)
    .resize({ width, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: false })
    .toFile(path.join(PUBLIC_DIR, "brand", "mega-test-drive-8.png"));
}

/* ── the social card ────────────────────────────────────────────────────── */

/**
 * The whole poster, for social cards only.
 *
 * The one place its baked-in typography is an asset rather than a liability: a
 * link preview is a single flat image with no room for real text. It is never
 * painted on the page, never cropped into a band, and never used as a ground.
 */
async function buildSocialCard() {
  const file = src("posterSquare");
  const { width, height } = await sharp(file, OPEN).metadata();
  log(`  ${SOURCES.posterSquare}  ${width}×${height}  →  poster.jpg 1200px`);
  if (ANALYZE) return;

  await ensureDir(path.join(PUBLIC_DIR, "event"));
  await sharp(file, OPEN)
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(PUBLIC_DIR, "event", "poster.jpg"));
}

/* ── entry ───────────────────────────────────────────────────────────────── */

async function main() {
  log(`source: ${SOURCE_DIR}`);
  const available = new Set(await readdir(SOURCE_DIR));
  const missing = Object.values(SOURCES).filter((name) => !available.has(name));
  if (missing.length > 0) {
    throw new Error(`missing source artwork: ${missing.join(", ")}`);
  }

  log(ANALYZE ? "\nmeasuring only (--analyze)\n" : "");
  log("lockup");
  await buildLockup();
  log("\nsocial card");
  await buildSocialCard();
  log(ANALYZE ? "\nnothing written." : "\ndone.");
}

await main();
