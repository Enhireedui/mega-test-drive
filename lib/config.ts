import type { EventConfig } from "@/types/event";

/**
 * SINGLE SOURCE OF TRUTH for MEGA TEST DRIVE 6.
 *
 * Every fact, name, number and asset path the page shows comes from here.
 * Running the next edition should mean editing this file and re-running
 * `scripts/prepare-assets.mjs` — nothing below is repeated anywhere else.
 *
 * The facts are transcribed from the official poster
 * ("Shiliin Bogd undsen poster.tif"): a two-day event on 8–9 August 2026 at the
 * central stadium in Sükhbaatar province, run inside the Шилийн Богд Moto
 * Festival, with SAIN MOTORS as general sponsor.
 */
export const eventConfig: EventConfig = {
  edition: 6,
  title: "MEGA TEST DRIVE 6",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://megatestdrive.sainmotors.mn",

  // Mongolia is UTC+8 all year.
  utcOffsetHours: 8,

  host: {
    name: "ШИЛИЙН БОГД MOTO FESTIVAL",
    logo: "/brand/shiliin-bogd.png",
    logoWidth: 1200,
    logoHeight: 341,
  },

  presenter: {
    name: "SAIN MOTORS",
    // As written on the poster, which credits them as general sponsor.
    role: "ЕРӨНХИЙ ИВЭЭН ТЭТГЭГЧ",
    // The footer signs off with the standing relationship instead: official
    // distributor. Same company, the other half of what they are to this event.
    signOffRole: "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР",
    logo: "/brand/sain-motors.png",
    logoWidth: 900,
    logoHeight: 337,
  },

  lockup: {
    src: "/brand/mega-test-drive-6.png",
    width: 1800,
    height: 521,
  },

  poster: { src: "/event/poster.jpg", width: 1200, height: 1500 },

  // Two days, so the form asks for a day as well as a time.
  dates: [
    {
      id: "2026.08.08",
      label: "2026.08.08",
      dayOfMonth: "08",
      weekday: "Бямба",
      iso: "2026-08-08",
    },
    {
      id: "2026.08.09",
      label: "2026.08.09",
      dayOfMonth: "09",
      weekday: "Ням",
      iso: "2026-08-09",
    },
  ],

  // Three-hour arrival windows covering 11:00 – 20:00.
  timeSlots: [
    { id: "11:00", label: "11:00" },
    { id: "14:00", label: "14:00" },
    { id: "17:00", label: "17:00" },
  ],
  slotDurationHours: 3,

  /*
   * No registration ceiling. Every day and every window accepts everyone who
   * signs up, so nobody is ever told a time is full.
   *
   * The only way to take a window off the form is to name it here by hand, as
   * `"<dateId>|<timeId>"` — e.g. "2026.08.09|17:00".
   */
  closedSlots: [],

  venue: {
    name: "Төв цэнгэлдэх хүрээлэн",
    region: "Сүхбаатар аймаг",
    // Fill in to show the "Замыг харах" link; empty keeps it hidden.
    mapUrl: "",
    // Baruun-Urt, the provincial centre — the coordinates the forecast uses.
    latitude: 46.6806,
    longitude: 113.2792,
    timeZone: "Asia/Ulaanbaatar",
  },

  /*
   * The ten marques, in the poster's reading order.
   *
   * `scale` is optical, not geometric. All ten marks were exported at a common
   * cap height, exactly as the poster sets them, but equal height is not equal
   * *weight*: SOUEAST is over three times as wide as 212 at that height, and
   * BYD's strokes are far heavier than JETOUR's. These multipliers pull the
   * extremes back so no single mark dominates the wall. Adjust by eye, never by
   * formula.
   */
  brands: [
    { name: "JETOUR", logo: "/brands/jetour.png", logoWidth: 560, logoHeight: 53, scale: 0.98 },
    { name: "SOUEAST", logo: "/brands/soueast.png", logoWidth: 560, logoHeight: 37, scale: 0.86 },
    { name: "CHERY", logo: "/brands/chery.png", logoWidth: 560, logoHeight: 69, scale: 1 },
    { name: "BYD", logo: "/brands/byd.png", logoWidth: 560, logoHeight: 107, scale: 0.95 },
    { name: "RIDDARA", logo: "/brands/riddara.png", logoWidth: 560, logoHeight: 52, scale: 0.97 },
    { name: "AITO", logo: "/brands/aito.png", logoWidth: 560, logoHeight: 76, scale: 1 },
    {
      name: "212 Special Edition",
      logo: "/brands/212.png",
      logoWidth: 560,
      logoHeight: 114,
      scale: 0.92,
    },
    { name: "BESTUNE", logo: "/brands/bestune.png", logoWidth: 560, logoHeight: 53, scale: 0.98 },
    { name: "RELY", logo: "/brands/rely.png", logoWidth: 560, logoHeight: 104, scale: 0.96 },
    { name: "MAXUS", logo: "/brands/maxus.png", logoWidth: 560, logoHeight: 55, scale: 1 },
  ],

  /*
   * Five questions, and no more.
   *
   * Every answer here restates either a fact printed on the poster or something
   * this form itself does. Nothing about price, prizes, documents, transport or
   * the running order is claimed, because none of that has been supplied — an
   * invented answer on a registration page is worse than no answer at all.
   * Anything the organiser confirms later belongs here, in this list.
   */
  faq: [
    {
      question: "Арга хэмжээ хэзээ, хаана болох вэ?",
      answer:
        "2026 оны 8 дугаар сарын 8, 9-нд — Бямба, Ням гарагт. Сүхбаатар аймгийн Төв цэнгэлдэх " +
        "хүрээлэнд, Шилийн Богд Moto Festival-ийн хүрээнд болно.",
    },
    {
      question: "Өдөр, цагаа хэрхэн сонгох вэ?",
      answer:
        "Бүртгэлийн хэсэгт хоёр өдрөөс өдрөө сонгоод, тухайн өдрийн гурван цагийн хуваарийн аль " +
        "нэгийг зааж өгнө. Цаг бүр хязгааргүй, тиймээс аль ч өдөр, аль ч цагийг чөлөөтэй сонгоно.",
    },
    {
      question: "Нэг утасны дугаараар хэд удаа бүртгүүлэх боломжтой вэ?",
      answer:
        "Нэг удаа. Туршин жолоодох хүн тус бүр өөрийн дугаараар бүртгүүлнэ — ингэснээр " +
        "бүртгэлийн жагсаалт хүн тус бүрээр бодит байна.",
    },
    {
      question: "Ямар мэдээлэл шаардах вэ?",
      answer:
        "Нэр, утасны дугаар, ирэх өдөр, ирэх цаг. Өөр ямар нэг мэдээлэл бөглөх шаардлагагүй.",
    },
    {
      question: "Бүртгэл баталгаажсаныг хэрхэн мэдэх вэ?",
      answer:
        "Бүртгэлийг илгээмэгц дэлгэц дээр баталгаажсан тухай шууд харагдана. Хэрэв харагдахгүй " +
        "бол бүртгэл хийгдээгүй гэсэн үг, тиймээс дахин илгээх шаардлагатай.",
    },
  ],
} as const;

/* ── derived values ───────────────────────────────────────────────────────── */

/** Counted from the brand list, never written down twice. */
export const brandCount = eventConfig.brands.length;

/** Composite key for one bookable slot. Must match the Apps Script key format. */
export function slotKey(dateId: string, timeId: string): string {
  return `${dateId}|${timeId}`;
}

/** True when the slot has been closed by hand in the config above. */
export function isSlotClosed(dateId: string, timeId: string): boolean {
  return eventConfig.closedSlots.includes(slotKey(dateId, timeId));
}

export function findEventDate(dateId: string): EventConfig["dates"][number] | undefined {
  return eventConfig.dates.find((date) => date.id === dateId);
}

export function isKnownTimeSlot(timeId: string): boolean {
  return eventConfig.timeSlots.some((slot) => slot.id === timeId);
}

/** "2026.08.08 – 09" across a range, or the single label for one day. */
export function eventDateRangeLabel(): string {
  const { dates } = eventConfig;
  const first = dates[0];
  if (!first) return "";
  const last = dates[dates.length - 1];
  if (!last || last === first) return first.label;
  return `${first.label} – ${last.dayOfMonth}`;
}

/** "Бямба, Ням" */
export function eventWeekdayLabel(): string {
  return eventConfig.dates.map((date) => date.weekday).join(", ");
}

/** "11:00 – 20:00", derived from the first slot and the last slot's end. */
export function eventHoursLabel(): string {
  const { timeSlots } = eventConfig;
  const first = timeSlots[0];
  const last = timeSlots[timeSlots.length - 1];
  if (!first || !last) return "";
  const [lastHour = "0", lastMinute = "00"] = last.id.split(":");
  const closingHour = Number(lastHour) + eventConfig.slotDurationHours;
  return `${first.label} – ${String(closingHour).padStart(2, "0")}:${lastMinute}`;
}

/** "11:00 – 14:00" for one slot, used on the slot controls. */
export function slotRangeLabel(timeId: string): string {
  const [hour = "0", minute = "00"] = timeId.split(":");
  const endHour = Number(hour) + eventConfig.slotDurationHours;
  return `${timeId} – ${String(endHour).padStart(2, "0")}:${minute}`;
}

/** "Сүхбаатар аймаг · Төв цэнгэлдэх хүрээлэн" */
export function venueLabel(): string {
  const { region, name } = eventConfig.venue;
  return region ? `${region} · ${name}` : name;
}

/**
 * Epoch milliseconds for the opening moment of every event day.
 * Pure — never reads the current time, so it is hydration-safe.
 */
export function eventStartTimestamps(): number[] {
  const firstSlot = eventConfig.timeSlots[0];
  if (!firstSlot) return [];
  const offset = eventConfig.utcOffsetHours;
  const sign = offset < 0 ? "-" : "+";
  const zone = `${sign}${String(Math.abs(offset)).padStart(2, "0")}:00`;
  return eventConfig.dates
    .map((date) => Date.parse(`${date.iso}T${firstSlot.id}:00${zone}`))
    .filter((value) => Number.isFinite(value));
}
