/**
 * Asset pipeline for MEGA TEST DRIVE 6.
 *
 * The artwork we are given is print-scale and composed for dark surfaces:
 *  - "MEGA logo.png" / "Sain motors logo.png" / "Shiliin bogd logo.png"
 *    are white-and-red lockups on transparency, 7–9k px wide.
 *  - "All brand logo.png" is a single 11811px strip holding all ten
 *    participating marks in two rows.
 *  - "Shiliin Bogd undsen poster.tif" is a 150MB layered poster whose middle
 *    third is the only fleet photography that exists for this edition.
 *
 * None of that can be shipped as-is, and none of it can be re-cut by hand
 * repeatably. This script is the reproducible step between the designer's
 * files and /public:
 *
 *   1. slices the brand strip into ten separate marks, found from the alpha
 *      channel rather than from hardcoded pixel offsets,
 *   2. re-inks those marks from white to near-black so they can sit on the
 *      white page (the red in the SAIN / Шилийн Богд / MEGA lockups is
 *      preserved, so they stay usable either way),
 *   3. crops the poster's photographic band out from between its two blocks of
 *      typography, giving a cinematic still with no baked-in text,
 *   4. trims and downscales everything to what the page actually paints.
 *
 * Run:  node scripts/prepare-assets.mjs [--analyze]
 * Source folder override:  MTD6_SOURCE_DIR="D:/path/to/art" node scripts/...
 *
 * Outputs are committed, so this only needs re-running when the artwork
 * changes. `--analyze` prints the measurements it derives without writing.
 */

import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const SOURCE_DIR =
  process.env.MTD6_SOURCE_DIR ??
  path.resolve(import.meta.dirname, "..", "..", "testDrive6");

const PUBLIC_DIR = path.resolve(import.meta.dirname, "..", "public");
const ANALYZE = process.argv.includes("--analyze");

/** Big TIFFs blow past libvips' default pixel ceiling. */
const OPEN = { limitInputPixels: false, unlimited: true };

const SOURCES = {
  mega: "MEGA logo.png",
  sain: "Sain motors logo.png",
  shiliinBogd: "Shiliin bogd logo.png",
  brandStrip: "All brand logo.png",
  poster: "Shiliin Bogd undsen poster.tif",
};

/**
 * Reading order of "All brand logo.png": five marks on the upper row, five on
 * the lower. Slice boundaries are measured, not listed — only the names and
 * the count are knowledge this file has to hold.
 */
const BRAND_ROWS = [
  ["jetour", "soueast", "chery", "byd", "riddara"],
  ["aito", "212", "bestune", "rely", "maxus"],
];

/** Darkest ink the re-inker maps pure white onto. Not #000 — that reads harsh. */
const INK_FLOOR = 12;

/** Where the achromatic/chromatic split falls. Antialiased white edges sit near 0. */
const CHROMA_CUTOFF = 45;

/** The red the lockups keep once re-inked, deepened just enough to hold on white. */
const INK_RED = [193, 12, 24];

const log = (...parts) => console.log(...parts);

function src(key) {
  return path.join(SOURCE_DIR, SOURCES[key]);
}

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

/* ── measurement ─────────────────────────────────────────────────────────── */

/**
 * Alpha-channel profile of an image: how much ink each row and each column
 * carries. Everything else here is derived from these two arrays.
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

/**
 * Runs of consecutive indices whose weight clears `threshold`.
 * Used to find the strip's two rows, and each row's letterforms.
 */
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

/**
 * Splits one row of the strip into exactly `count` marks.
 *
 * A gap-width threshold cannot do this: AITO is set with letterspacing as wide
 * as the space between two neighbouring brands, so any single cutoff either
 * splits AITO into four marks or merges RELY into MAXUS. Since the number of
 * marks per row is known, take the `count - 1` widest gaps instead — that is
 * scale-free and cannot miscount.
 */
function splitIntoMarks(columns, from, to, count, floor) {
  const runs = occupiedRuns(columns.subarray(from, to + 1), floor).map((run) => ({
    start: run.start + from,
    end: run.end + from,
  }));

  if (runs.length < count) {
    throw new Error(`found only ${runs.length} ink runs, need at least ${count}`);
  }

  const gaps = runs
    .slice(1)
    .map((run, index) => ({ index: index + 1, width: run.start - runs[index].end }))
    .sort((a, b) => b.width - a.width);

  const cuts = new Set(gaps.slice(0, count - 1).map((gap) => gap.index));

  const marks = [];
  let current = { start: runs[0].start, end: runs[0].end };

  for (let i = 1; i < runs.length; i += 1) {
    if (cuts.has(i)) {
      marks.push(current);
      current = { start: runs[i].start, end: runs[i].end };
    } else {
      current.end = runs[i].end;
    }
  }
  marks.push(current);

  const narrowestSplit = gaps[count - 2]?.width ?? 0;
  const widestKept = gaps[count - 1]?.width ?? 0;

  return { marks, narrowestSplit, widestKept };
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

/* ── re-inking ───────────────────────────────────────────────────────────── */

/**
 * White artwork → dark artwork, for the marks that have to live on the white
 * page. Achromatic pixels are inverted into [INK_FLOOR, 255]; anything with
 * real chroma is the brand red and is set to INK_RED rather than inverted,
 * because inverting red yields cyan.
 *
 * Alpha is untouched, so antialiased edges still composite cleanly.
 */
async function reInk(file, { width }) {
  const pipeline = sharp(file, OPEN).ensureAlpha();
  const { data, info } = await pipeline.raw().toBuffer({ resolveWithObject: true });

  let chromaticPixels = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);

    if (chroma > CHROMA_CUTOFF) {
      chromaticPixels += 1;
      [data[i], data[i + 1], data[i + 2]] = INK_RED;
      continue;
    }

    const value = (r + g + b) / 3;
    const ink = Math.round(INK_FLOOR + ((255 - value) * (255 - INK_FLOOR)) / 255);
    data[i] = ink;
    data[i + 1] = ink;
    data[i + 2] = ink;
  }

  const inked = sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });

  return {
    pipeline: width ? inked.resize({ width, withoutEnlargement: true }) : inked,
    chromaticPixels,
  };
}

/* ── steps ───────────────────────────────────────────────────────────────── */

/**
 * The three lockups, kept exactly as drawn — white and red on transparency.
 * They are painted on the dark hero and the dark footer, which is what the
 * artwork was composed for.
 *
 * `dropLeadingBand` cuts the topmost band of ink off a lockup. The SAIN MOTORS
 * artwork carries "ЕРӨНХИЙ ИВЭЭН ТЭТГЭГЧ" above the wordmark as a hairline
 * outline; at the size a sponsor credit is actually shown that line collapses
 * into grey mush, so it is removed here and set as real letterspaced type
 * instead. The wordmark keeps its own proportions either way.
 */
async function buildLockups() {
  const targets = [
    { key: "mega", out: "brand/mega-test-drive-6.png", width: 1800 },
    { key: "sain", out: "brand/sain-motors.png", width: 900, dropLeadingBand: true },
    { key: "shiliinBogd", out: "brand/shiliin-bogd.png", width: 1200 },
  ];

  for (const { key, out, width, dropLeadingBand } of targets) {
    const file = src(key);
    const profile = await alphaProfile(file);
    let box = alphaBox(profile);

    if (dropLeadingBand) {
      /*
       * Bands are runs of inked rows separated by clear space. Two guards keep
       * this from latching onto the wrong thing: the ink threshold is relative
       * to the heaviest row so it survives any export scale, and bands thinner
       * than 1% of the image are discarded as edge noise — the source has a few
       * near-empty rows along its top border that are not type at all.
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
        `  ${SOURCES[key]}  bands: ` +
          bands.map((b) => `${b.start}–${b.end}`).join(", ") +
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

/**
 * The ten participating marks, cut out of the single strip and re-inked for
 * the white brand wall.
 */
async function buildBrandMarks() {
  const file = src("brandStrip");
  const profile = await alphaProfile(file);

  /* Thresholds as a fraction of the heaviest row/column, so they hold at any
     export scale. Low, because these marks are thin outlines. */
  const rowFloor = Math.max(...profile.rows) * 0.02;
  const rowRuns = occupiedRuns(profile.rows, rowFloor);

  if (rowRuns.length !== BRAND_ROWS.length) {
    throw new Error(`expected ${BRAND_ROWS.length} rows in the brand strip, found ${rowRuns.length}`);
  }

  log(`  ${SOURCES.brandStrip}  ${profile.width}×${profile.height}`);
  await ensureDir(path.join(PUBLIC_DIR, "brands"));

  for (const [rowIndex, names] of BRAND_ROWS.entries()) {
    const { start: top, end: bottom } = rowRuns[rowIndex];

    /* Re-profile columns for this row alone — the two rows do not share
       column occupancy, and measuring both together merges their gaps. */
    const band = await alphaProfile(
      await sharp(file, OPEN)
        .extract({ left: 0, top, width: profile.width, height: bottom - top + 1 })
        .png()
        .toBuffer(),
    );

    const columnFloor = Math.max(...band.columns) * 0.015;
    const { marks, narrowestSplit, widestKept } = splitIntoMarks(
      band.columns,
      0,
      band.width - 1,
      names.length,
      columnFloor,
    );

    log(
      `  row ${rowIndex + 1}: y ${top}–${bottom}` +
        `  ·  split on gaps ≥${narrowestSplit}px, kept gaps ≤${widestKept}px`,
    );

    for (const [markIndex, name] of names.entries()) {
      const { start, end } = marks[markIndex];
      const region = {
        left: start,
        top,
        width: end - start + 1,
        height: bottom - top + 1,
      };

      const cut = await sharp(file, OPEN).extract(region).png().toBuffer();
      const cutBox = alphaBox(await alphaProfile(cut));
      const tight = await sharp(cut).extract(cutBox).png().toBuffer();

      const { pipeline, chromaticPixels } = await reInk(tight, { width: 560 });
      log(
        `    ${name.padEnd(9)} x ${String(start).padStart(5)}–${String(end).padEnd(5)}` +
          `  ${cutBox.width}×${cutBox.height}` +
          (chromaticPixels > 0 ? `  (${chromaticPixels} coloured px kept red)` : ""),
      );

      if (ANALYZE) continue;
      await pipeline
        .png({ compressionLevel: 9, palette: false })
        .toFile(path.join(PUBLIC_DIR, "brands", `${name}.png`));
    }
  }
}

/**
 * Rows carrying bright, saturated red.
 *
 * That is the poster's display typography — "Moto Festival" above the fleet and
 * the "Event" script below it. The sky behind the mountains is red too, but it
 * is a dark wash: the brightness floor separates the two, so this finds type
 * and not sky.
 */
async function brightRedRows(file) {
  const { data, info } = await sharp(file, OPEN).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const counts = new Int32Array(height);

  for (let y = 0; y < height; y += 1) {
    const rowStart = y * width * channels;
    let hits = 0;
    for (let x = 0; x < width; x += 1) {
      const i = rowStart + x * channels;
      const r = data[i];
      if (r > 170 && r - Math.max(data[i + 1], data[i + 2]) > 110) hits += 1;
    }
    counts[y] = hits;
  }

  return { width, height, counts };
}

/**
 * Photography out of the poster.
 *
 * The poster is a vertical stack: sponsor lockup, festival title, then the
 * fleet on its reflective ground, then the MEGA lockup, brand names and
 * logistics. Only the middle band is usable on the site — everything else is
 * typography that would be duplicated by real text, at the wrong size, in a
 * language we cannot restyle.
 *
 * So the band is *measured*: it runs from below the last row of the festival
 * title to above the first row of the MEGA lockup, both located by their red.
 * A margin absorbs the glow and antialiasing around those glyphs, which carry
 * no saturation of their own but would still show as a smear along the edge.
 */
async function buildPhotography() {
  const file = src("poster");
  const { width, height, counts } = await brightRedRows(file);
  const midpoint = Math.floor(height / 2);

  let titleEnd = -1;
  for (let y = 0; y < midpoint; y += 1) if (counts[y] > 0) titleEnd = y;

  let lockupStart = -1;
  for (let y = midpoint; y < height; y += 1) {
    if (counts[y] > 0) {
      lockupStart = y;
      break;
    }
  }

  if (titleEnd === -1 || lockupStart === -1) {
    throw new Error("could not locate the poster's red typography blocks");
  }

  /* ~0.6% of the poster height. Enough to clear the halo, small enough to keep
     the mountain ridge and the foreground reflection. */
  const margin = Math.round(height * 0.006);
  const top = titleEnd + margin;
  const bottom = lockupStart - margin;

  const band = { left: 0, top, width, height: bottom - top };
  log(
    `  ${SOURCES.poster}  ${width}×${height}` +
      `\n  red type: title ends y ${titleEnd}, lockup starts y ${lockupStart}, margin ${margin}px` +
      `\n  →  fleet band y ${top}–${bottom} (${band.width}×${band.height}, ` +
      `${(band.width / band.height).toFixed(2)}:1)`,
  );
  if (ANALYZE) return;

  await ensureDir(path.join(PUBLIC_DIR, "event"));

  await sharp(file, OPEN)
    .extract(band)
    .resize({ width: 2400, withoutEnlargement: true })
    .jpeg({ quality: 84, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(path.join(PUBLIC_DIR, "event", "fleet.jpg"));

  /* The whole poster, for social cards — the one place the baked-in
     typography is an asset rather than a liability. */
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
  log("\nbrand marks");
  await buildBrandMarks();
  log("\nphotography");
  await buildPhotography();
  log(ANALYZE ? "\nnothing written." : "\ndone.");
}

await main();
