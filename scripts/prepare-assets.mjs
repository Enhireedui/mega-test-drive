/**
 * Asset pipeline for MEGA EVENT TEST DRIVE 7 — OFF-ROAD EDITION.
 *
 * The artwork supplied for this edition is four files in `../testdriver7`:
 *
 *  - "Logo-MT7-OFF.png"      the campaign lockup — MEGA Event / TEST DRIVE 7 /
 *                            OFF-ROAD EDITION — chrome-and-red on transparency,
 *                            1845×731. This is the page's signature and is never
 *                            rebuilt as type.
 *  - "Logo-MT7-OFF-2.png"    the SAIN MOTORS lockup on transparency, with
 *                            "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР" set above the wordmark.
 *  - "MEGA OFF-ROAD undsen poster 1x1 ratio.png"      3543², the feed poster.
 *  - "MEGA OFF-ROAD undsen poster story ratio.png"    2362×4198, the story cut.
 *
 * The page itself carries no photography — the campaign lockup is its whole visual
 * argument — so all this script produces is the two lockups and one social card.
 *
 * The posters are a vertical sandwich: sponsor lockup, campaign lockup, the fleet on
 * grass, then a black bar carrying the date, place and hours. Three of those four
 * layers are typography the page sets as real text, so neither poster can be shipped
 * as a hero. Only the square one is kept, whole, as the social card — a link preview
 * is the one place baked-in type is the right answer.
 *
 * ("MEGA OFF-ROAD Page cover.png" is also supplied and is deliberately unused. It was
 * placed at the top of the page and measured: at 2.68:1 it pushed the submit button
 * below the fold at every width, and cropping it to a band was cut on request.)
 *
 * Run:  node scripts/prepare-assets.mjs [--analyze]
 * Source override:  MTD7_SOURCE_DIR="D:/path/to/art" node scripts/prepare-assets.mjs
 *
 * Outputs are committed, so this only re-runs when the artwork changes.
 * `--analyze` prints every measurement it derives and writes nothing.
 */

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SOURCE_DIR =
  process.env.MTD7_SOURCE_DIR ?? path.resolve(import.meta.dirname, "..", "..", "testdriver7");

const PUBLIC_DIR = path.resolve(import.meta.dirname, "..", "public");
const ANALYZE = process.argv.includes("--analyze");

/** The posters are 14MP and 10MP; libvips' default ceiling is lower. */
const OPEN = { limitInputPixels: false, unlimited: true };

const SOURCES = {
  lockup: "Logo-MT7-OFF.png",
  sain: "Logo-MT7-OFF-2.png",
  posterSquare: "MEGA OFF-ROAD undsen poster 1x1 ratio.png",
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
 * channel. Every crop below is derived from these two arrays rather than from
 * pixel offsets typed in by hand, so re-exporting the artwork at another scale
 * does not silently move a crop.
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

/* ── lockups ─────────────────────────────────────────────────────────────── */

/**
 * The two lockups, kept exactly as drawn — chrome, white and red on
 * transparency. Both were composed for a dark ground, which is the only ground
 * this page has, so nothing is re-inked and no effect is added. They are trimmed
 * to their own ink and downscaled to what the page actually paints, and that is
 * the whole treatment.
 *
 * `dropLeadingBand` removes the topmost band of ink from a lockup. The SAIN
 * MOTORS artwork carries "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР" above the wordmark as a
 * hairline; at the size a distributor credit is shown that line collapses into
 * grey mush, so it comes off here and the page sets it as real letterspaced type
 * instead. The wordmark keeps its own proportions either way.
 */
async function buildLockups() {
  const targets = [
    { key: "lockup", out: "brand/mega-test-drive-7.png", width: 1800 },
    { key: "sain", out: "brand/sain-motors.png", width: 900, dropLeadingBand: true },
  ];

  for (const { key, out, width, dropLeadingBand } of targets) {
    const file = src(key);
    const profile = await alphaProfile(file);
    let box = alphaBox(profile);

    if (dropLeadingBand) {
      /*
       * Bands are runs of inked rows separated by clear space. Two guards keep
       * this off the wrong thing: the ink threshold is a fraction of the
       * heaviest row, so it survives any export scale, and bands under 1% of the
       * image height are discarded as border noise rather than type.
       */
      const inkFloor = Math.max(...profile.rows) * 0.02;
      const minBandHeight = profile.height * 0.01;
      const bands = occupiedRuns(profile.rows, inkFloor).filter(
        (band) => band.end - band.start + 1 >= minBandHeight,
      );

      if (bands.length < 2) {
        throw new Error(`${SOURCES[key]}: expected a role line above the wordmark`);
      }

      log(
        `  ${SOURCES[key]}  bands: ${bands.map((b) => `${b.start}–${b.end}`).join(", ")}` +
          `  →  dropping the first`,
      );
      const wordmarkTop = bands[1].start;
      box = { ...box, top: wordmarkTop, height: box.top + box.height - wordmarkTop };
    }

    log(
      `  ${SOURCES[key]}  ${profile.width}×${profile.height}` +
        `  →  trim ${box.width}×${box.height}  →  ${width}px wide`,
    );
    if (ANALYZE) continue;

    await ensureDir(path.dirname(path.join(PUBLIC_DIR, out)));
    await sharp(file, OPEN)
      .extract(box)
      .resize({ width, withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: false })
      .toFile(path.join(PUBLIC_DIR, out));
  }
}

/* ── the social card ────────────────────────────────────────────────────── */

/**
 * The whole poster, for social cards only.
 *
 * The one place its baked-in typography is an asset rather than a liability: a
 * link preview is a single flat image with no room for real text. It is never
 * painted on the page.
 *
 * Earlier editions also cut a photographic band out from between the poster's two
 * blocks of red typography, to use as the page's hero ground. That is gone — the
 * page carries no photography at all now, so this is the only bitmap left that has
 * a vehicle in it.
 */
async function buildSocialCard() {
  const file = src("posterSquare");
  const { width, height } = await sharp(file, OPEN).metadata();
  log(`  ${SOURCES.posterSquare}  ${width}x${height}  ->  poster.jpg 1200px`);
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
  log("lockups");
  await buildLockups();
  log("\nsocial card");
  await buildSocialCard();
  log(ANALYZE ? "\nnothing written." : "\ndone.");
}

await main();
