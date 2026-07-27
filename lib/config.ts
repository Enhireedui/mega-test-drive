import type { EventConfig } from "@/types/registration";

/**
 * SINGLE SOURCE OF TRUTH for the event.
 *
 * Running the next edition should only require edits in this file:
 * dates, time slots, per-slot capacity, venue, brands and headline copy.
 * Nothing below is duplicated anywhere else in the app.
 */
export const eventConfig: EventConfig = {
  edition: 5,
  title: "MEGA TEST DRIVE 5",
  distributor: "SAIN MOTORS",
  distributorNote: "АЛБАН ЁСНЫ ДИСТРИБЬЮТЕР",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://megatestdrive.sainmotors.mn",

  // Ulaanbaatar is UTC+8 year round.
  utcOffsetHours: 8,

  // A single event day, so the form asks only for a time. Adding a second date
  // here would also mean reintroducing a date picker in RegistrationCard.
  dates: [{ id: "2026.08.01", label: "2026.08.01", weekday: "Бямба", iso: "2026-08-01" }],

  // Three-hour intervals covering 11:00 – 20:00.
  timeSlots: [
    { id: "11:00", label: "11:00" },
    { id: "14:00", label: "14:00" },
    { id: "17:00", label: "17:00" },
  ],
  slotDurationHours: 3,

  maxPerSlot: 40,

  // Close a slot by hand with `"<dateId>|<timeId>"`, e.g. "2026.08.01|14:00".
  closedSlots: [],

  venue: {
    name: "BYD 4S Showroom",
    hint: "Цамбагаравын баруун урд",
    mapUrl: "",
  },

  // TODO before launch: fill in the official contact channels.
  // Empty strings intentionally hide the corresponding rows rather than
  // shipping placeholder data.
  contact: {
    phone: "",
    facebookUrl: "",
    instagramUrl: "",
  },

  brands: [
    "JETOUR",
    "SOUEAST",
    "CHERY",
    "BYD",
    "RIDDARA",
    "AITO",
    "212",
    "BESTUNE",
    "RELY",
    "MAXUS",
  ],

  stats: {
    brandCount: 11,
    modelCountLabel: "20 гаруй",
    luckyDrawGuests: 50,
  },

  intro: {
    lead: "Бүртгүүлсэн эхний 50 зочин азын хүрд эргүүлэх эрхтэй!",
    body: [
      "11 брэндийн 20 гаруй шинэ загварыг туршин жолоодож, энэ сарын хамгийн том MEGA TEST DRIVE 5 өдөрлөгт оролцоорой.",
      "Та гэр бүл, найз нөхөдтэйгөө хүрэлцэн ирж, өөрт таалагдсан автомашинаа туршиж нэг өдрийг сонирхолтой өнгөрүүлэхийг урьж байна.",
    ],
  },
} as const;

/** Composite key for one bookable slot. Must match the Apps Script key format. */
export function slotKey(dateId: string, timeId: string): string {
  return `${dateId}|${timeId}`;
}

/** True when the slot has been closed by hand in the config. */
export function isSlotClosed(dateId: string, timeId: string): boolean {
  return eventConfig.closedSlots.includes(slotKey(dateId, timeId));
}

export function findEventDate(dateId: string): EventConfig["dates"][number] | undefined {
  return eventConfig.dates.find((date) => date.id === dateId);
}

export function isKnownTimeSlot(timeId: string): boolean {
  return eventConfig.timeSlots.some((slot) => slot.id === timeId);
}

/** "2026.07.04 – 07.05" for a range, or the single label for one date. */
export function eventDateRangeLabel(): string {
  const dates = eventConfig.dates;
  const first = dates[0];
  if (!first) return "";
  const last = dates[dates.length - 1];
  if (!last || last === first) return first.label;
  return `${first.label} – ${last.label.slice(5)}`;
}

/** "Бямба, Ням" */
export function eventWeekdayLabel(): string {
  return eventConfig.dates.map((date) => date.weekday).join(", ");
}

/** "11:00 – 17:00", derived from the first slot and the last slot's end. */
export function eventHoursLabel(): string {
  const slots = eventConfig.timeSlots;
  const first = slots[0];
  const last = slots[slots.length - 1];
  if (!first || !last) return "";
  const [lastHour = "0", lastMinute = "00"] = last.id.split(":");
  const closingHour = Number(lastHour) + eventConfig.slotDurationHours;
  return `${first.label} – ${String(closingHour).padStart(2, "0")}:${lastMinute}`;
}

/** "11:00 – 13:00" for one slot, used on the slot cards. */
export function slotRangeLabel(timeId: string): string {
  const [hour = "0", minute = "00"] = timeId.split(":");
  const endHour = Number(hour) + eventConfig.slotDurationHours;
  return `${timeId} – ${String(endHour).padStart(2, "0")}:${minute}`;
}

/**
 * Epoch milliseconds for the opening moment of every event day.
 * Pure — no reference to the current time, so it is hydration-safe.
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
