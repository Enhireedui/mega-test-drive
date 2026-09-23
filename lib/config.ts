import type { EventConfig } from "@/types/event";

/**
 * SINGLE SOURCE OF TRUTH for MEGA EVENT TEST DRIVE 8 — ДАРХАН ХОТ.
 *
 * Every fact, name and asset path the page shows comes from here. Running the
 * next edition should mean editing this file and re-running
 * `scripts/prepare-assets.mjs` — nothing below is repeated anywhere else.
 *
 * ── Provenance ────────────────────────────────────────────────────────────
 * The facts are transcribed from the supplied poster
 * ("MEGA DARKHAN CITY undsen poster 1x1 ratio 2.png") and from nowhere else.
 * Its header reads "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР / SAIN MOTORS"; its foot reads,
 * left to right:
 *
 *     2026.10.01, 02      Дархан хот                       10:00 - 19:00
 *     Пүрэв, Баасан гараг Дархан Плазагаас шинэ Дархан      цагийн хооронд
 *                         явах замд
 *
 *
 * ── What is deliberately absent ───────────────────────────────────────────
 * No coach, no meeting point, no phone number, no price, no prizes, no
 * giveaways, no capacity, no map link and no list of makes. Edition 7 had a
 * shuttle timetable and a map URL because the organiser supplied them; this
 * poster carries neither, so neither is on the page. A registration page that
 * invents any of it is making a promise the organiser never made. Anything
 * confirmed later belongs here, in this file, and nowhere else.
 */
export const eventConfig: EventConfig = {
  edition: 8,
  title: "MEGA EVENT TEST DRIVE 8",
  /* What goes in the sheet's event column, as the organiser names the campaign. */
  eventId: "MEGA TEST DRIVE 8",
  editionName: "ДАРХАН ХОТ",
  /* `URL` is set by Netlify at build time to the site's primary address — the
     custom domain once one is attached, sainmotors1.netlify.app until then — so
     canonical and Open Graph URLs always point somewhere that resolves. It wins
     over NEXT_PUBLIC_SITE_URL because a stale value there (megatestdrive.
     sainmotors.mn, which has no DNS) broke every link preview. */
  siteUrl:
    process.env.URL || process.env.NEXT_PUBLIC_SITE_URL || "https://sainmotors1.netlify.app",

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
   * The campaign lockup: MEGA Event / TEST DRIVE 8 over the red ДАРХАН ХОТ
   * plate, white-and-chrome on transparency. This is the identity — it is
   * placed, never recreated as type, never recoloured, never distorted, and
   * nothing is layered over it.
   */
  lockup: { src: "/brand/mega-test-drive-8.png", width: 1800, height: 727 },

  /*
   * The full poster, for social cards only — never painted on the page.
   *
   * It is the only photography the site ships. There is no photographic band in
   * the layout: the campaign lockup carries the page, and a link preview is the
   * one place a flat image with baked-in type is the right answer.
   */
  poster: { src: "/event/poster.jpg", width: 1200, height: 1200 },

  /*
   * Two days. The poster sets them as one line — "2026.10.01, 02" over
   * "Пүрэв, Баасан гараг" — and the form asks which one, because an organiser
   * running a fleet on two separate days cannot staff them from a list of times
   * alone.
   */
  days: [
    { id: "10.01", label: "10.01", weekday: "Пүрэв", iso: "2026-10-01" },
    { id: "10.02", label: "10.02", weekday: "Баасан", iso: "2026-10-02" },
  ],

  /*
   * Four arrival slots inside the open hours. Not a capacity and not a booking:
   * the door is open 10:00–19:00 either day, and these are the times people are
   * asked to aim for so the fleet is not all claimed at once.
   */
  slots: [
    { id: "10:00", label: "10:00" },
    { id: "12:00", label: "12:00" },
    { id: "14:00", label: "14:00" },
    { id: "16:00", label: "16:00" },
  ],

  /* The en dash is the poster's hyphen set properly for screen type. */
  hours: {
    label: "10:00 – 19:00",
    note: "цагийн хооронд",
    opensAt: "10:00",
    closesAt: "19:00",
  },

  venue: {
    /* For metadata and structured data. Never set as display type: the lockup's
       red plate already prints ДАРХАН ХОТ. */
    name: "Дархан хот",
    /* What the page sets large, and what a driver actually navigates by. */
    landmark: "Дархан Плаза",
    approach: "Шинэ Дархан явах зам",
    /* No map link was supplied for this edition. An empty string hides the link
       rather than linking nowhere; no destination may be fabricated. */
    mapUrl: "",
    /* Unknown, and left unknown. A guessed coordinate would be published as fact
       in the page's structured data. `null` omits the geo block entirely. */
    latitude: null,
    longitude: null,
    timeZone: "Asia/Ulaanbaatar",
  },

} as const;

/* ── derived values ───────────────────────────────────────────────────────── */

/** "Дархан хот · Дархан Плаза" — for metadata, where the city has to be named. */
export function venueLabel(): string {
  const { name, landmark } = eventConfig.venue;
  return landmark ? `${name} · ${landmark}` : name;
}

/**
 * "2026.10.01, 02" — both days, set the way the poster sets them.
 *
 * The year and the month are stated once and the second day carries only its
 * own number. Repeating the month ("10.01, 10.02") is what a machine would
 * write; the poster's form is shorter, unambiguous in context, and already the
 * way the campaign has been published everywhere else.
 */
export function datesLabel(): string {
  const [first, ...rest] = eventConfig.days;
  if (!first) return "";
  const dayNumber = (label: string) => label.split(".").pop() ?? label;
  return [`2026.${first.label}`, ...rest.map((day) => dayNumber(day.label))].join(", ");
}

/**
 * "Пүрэв, Баасан" — the weekdays alone.
 *
 * Without the trailing "гараг" the poster prints, because on the page this value
 * sits against a label that already says ГАРАГ, and "Гараг: Пүрэв, Баасан гараг"
 * says the word twice in one row.
 */
export function weekdaysLabel(): string {
  return eventConfig.days.map((day) => day.weekday).join(", ");
}

/**
 * Epoch milliseconds for a "HH:mm" time on a given ISO day, in the venue's zone.
 *
 * Pure — never reads the current time, so it is hydration-safe. Returns `null`
 * when the value cannot be parsed, so a caller can omit the field rather than
 * publish `Invalid Date`.
 */
function eventTimestamp(iso: string, time: string): number | null {
  const { utcOffsetHours } = eventConfig;
  const sign = utcOffsetHours < 0 ? "-" : "+";
  const zone = `${sign}${String(Math.abs(utcOffsetHours)).padStart(2, "0")}:00`;
  const parsed = Date.parse(`${iso}T${time}:00${zone}`);
  return Number.isFinite(parsed) ? parsed : null;
}

/** The moment the first day opens, for structured data. */
export function eventStartTimestamp(): number | null {
  const first = eventConfig.days[0];
  return first ? eventTimestamp(first.iso, eventConfig.hours.opensAt) : null;
}

/** The moment the last day closes, on the same terms. */
export function eventEndTimestamp(): number | null {
  const last = eventConfig.days[eventConfig.days.length - 1];
  return last ? eventTimestamp(last.iso, eventConfig.hours.closesAt) : null;
}

/** Every answer the day question accepts. */
export function dayChoices(): readonly string[] {
  return eventConfig.days.map((day) => day.id);
}

/** Every answer the time question accepts. */
export function slotChoices(): readonly string[] {
  return eventConfig.slots.map((slot) => slot.id);
}

/**
 * What gets written to the sheet's day column.
 *
 * Spelled out rather than sent as a bare id: the organiser reads this column to
 * staff two separate days, and "10.01" alone does not say which weekday that is
 * at a glance.
 */
export function dayLabel(choice: string): string {
  const day = eventConfig.days.find((item) => item.id === choice);
  return day ? `${day.label} (${day.weekday})` : choice;
}
