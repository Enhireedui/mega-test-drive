import type { EventConfig } from "@/types/event";

/**
 * SINGLE SOURCE OF TRUTH for MEGA EVENT TEST DRIVE 7 — OFF-ROAD EDITION.
 *
 * Every fact, name and asset path the page shows comes from here. Running the
 * next edition should mean editing this file and re-running
 * `scripts/prepare-assets.mjs` — nothing below is repeated anywhere else.
 *
 * ── Provenance ────────────────────────────────────────────────────────────
 * The facts are transcribed from the supplied poster
 * ("MEGA OFF-ROAD undsen poster 1x1 ratio.png") and from nowhere else. Its
 * black information bar reads, left to right:
 *
 *     2026.08.22          Морингийн даваа       11:00 - 19:00
 *     Бямба гараг         Наадамчдын зам        цагийн хооронд
 *
 * and its header reads "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР / SAIN MOTORS".
 *
 * An early brief wrote the venue's second line as "Надамын зам". The poster
 * prints "Наадамчдын зам", and the poster is the source of truth — so that is
 * what is set here and what the page shows.
 *
 * ── What is deliberately absent ───────────────────────────────────────────
 * No price, no prizes, no giveaways, no refreshments, no entertainment, no
 * vehicle count, no capacity, no model list, and no promise of an SMS. None of
 * it has been supplied for this edition, and a registration page that invents
 * any of it is making a promise the organiser never made. Anything the
 * organiser confirms later belongs here, in this file, and nowhere else.
 */
export const eventConfig: EventConfig = {
  edition: 7,
  title: "MEGA EVENT TEST DRIVE 7",
  editionName: "OFF-ROAD EDITION",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://megatestdrive.sainmotors.mn",

  // Mongolia is UTC+8 all year.
  utcOffsetHours: 8,

  presenter: {
    name: "SAIN MOTORS",
    // As written above the wordmark on the poster.
    role: "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР",
    logo: "/brand/sain-motors.png",
    logoWidth: 900,
    logoHeight: 218,
  },

  /*
   * The campaign lockup: MEGA Event / TEST DRIVE 7 / OFF-ROAD EDITION, chrome and
   * red on transparency. This is the identity — it is placed, never recreated as
   * type, never recoloured, never distorted, and nothing is layered over it.
   */
  lockup: { src: "/brand/mega-test-drive-7.png", width: 1800, height: 713 },

  /*
   * The full poster, for social cards only — never painted on the page.
   *
   * It is the only photography the site ships. There is no photographic band in the
   * layout: the campaign lockup carries the page, and a link preview is the one
   * place a flat image with baked-in type is the right answer.
   */
  poster: { src: "/event/poster.jpg", width: 1200, height: 1200 },

  date: {
    label: "2026.08.22",
    // The poster sets "Бямба гараг" as one phrase; it is kept whole.
    weekday: "Бямба гараг",
    iso: "2026-08-22",
  },

  /*
   * One window, and it is not a booking. Edition 6 asked visitors to choose a
   * three-hour slot; this edition does not, so the hours are a fact the page
   * states rather than a control it renders.
   *
   * The en dash is the poster's hyphen set properly for screen type.
   */
  hours: {
    label: "11:00 – 19:00",
    note: "цагийн хооронд",
    opensAt: "11:00",
    closesAt: "19:00",
  },

  venue: {
    name: "Морингийн даваа",
    approach: "Наадамчдын зам",
    /* Supplied by the organiser. An empty string hides the link rather than
       linking nowhere; no map destination may be fabricated. */
    mapUrl: "https://maps.app.goo.gl/cbW2hEZnDVDuWD1C9",
    /* Unknown, and left unknown. A mountain pass has no lookup-able address, and
       a guessed coordinate would be published as fact in the page's structured
       data. `null` omits the geo block entirely. */
    latitude: null,
    longitude: null,
    timeZone: "Asia/Ulaanbaatar",
  },

  /*
   * The coach, exactly as supplied.
   *
   * Three runs, each with a departure and the time it starts back — the two
   * columns of the organiser's timetable ("BYD-аас хөдлөх" / "Морингын даваанаас
   * хөдлөх") paired up, because a run out and the run home are one choice, not
   * two. The form sets each pair on a single control rather than printing the
   * table and then asking the question underneath it.
   */
  transport: {
    meetingPoint: "Цамбагарав баруун урд, BYD 4S showroom",
    runs: [
      { id: "10:00", departs: "10:00", returns: "12:00" },
      { id: "13:00", departs: "13:00", returns: "15:00" },
      { id: "16:00", departs: "16:00", returns: "18:00" },
    ],
    ownCarLabel: "Хувийн унаагаар",
  },
} as const;

/* ── derived values ───────────────────────────────────────────────────────── */

/** "Морингийн даваа · Наадамчдын зам" */
export function venueLabel(): string {
  const { name, approach } = eventConfig.venue;
  return approach ? `${name} · ${approach}` : name;
}

/**
 * Epoch milliseconds for a "HH:mm" time on the event's day, in the venue's zone.
 *
 * Pure — never reads the current time, so it is hydration-safe. Returns `null`
 * when the value cannot be parsed, so a caller can omit the field rather than
 * publish `Invalid Date`.
 */
function eventTimestamp(time: string): number | null {
  const { date, utcOffsetHours } = eventConfig;
  const sign = utcOffsetHours < 0 ? "-" : "+";
  const zone = `${sign}${String(Math.abs(utcOffsetHours)).padStart(2, "0")}:00`;
  const parsed = Date.parse(`${date.iso}T${time}:00${zone}`);
  return Number.isFinite(parsed) ? parsed : null;
}

/** The moment the event opens, for structured data. */
export function eventStartTimestamp(): number | null {
  return eventTimestamp(eventConfig.hours.opensAt);
}

/** The moment it closes, on the same terms. */
export function eventEndTimestamp(): number | null {
  return eventTimestamp(eventConfig.hours.closesAt);
}

/** Sentinel for "I will drive myself", kept out of the shuttle id space. */
export const OWN_CAR = "own-car" as const;

/** Every answer the transport question accepts. */
export function transportChoices(): readonly string[] {
  return [...eventConfig.transport.runs.map((run) => run.id), OWN_CAR];
}

/**
 * What gets written to the sheet's transport column.
 *
 * Spelled out rather than sent as a raw id: the organiser reads this column to
 * load a coach, and "10:00" alone does not say whether that is a seat booked or a
 * person arriving under their own steam.
 */
export function transportLabel(choice: string): string {
  if (choice === OWN_CAR) return eventConfig.transport.ownCarLabel;
  const run = eventConfig.transport.runs.find((item) => item.id === choice);
  return run ? `Автобус ${run.departs} (буцах ${run.returns})` : choice;
}
